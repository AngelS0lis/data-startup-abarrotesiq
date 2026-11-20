"""Despliegue 100% Gratuito ($0.00 USD) del Punto de Venta + Dashboard en AWS S3 Static Website Hosting.

- Usa el nombre de bucket limpio `abarrotes-iq` (y elimina automáticamente el bucket anterior `abarrotesiq-pos-judith`).
- Sube el bundle 100% autocontenido (`dist/assets/app.js`, 1.3 MB) dentro de los 5,000 MB gratis de Amazon S3.

Uso:
    py -3.11 services/worker/deploy_pos_s3.py
"""

from __future__ import annotations

import json
import mimetypes
import os
import subprocess
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

RAIZ = Path(__file__).resolve().parents[2]
load_dotenv(RAIZ / ".env")

MAPA_MIME_EXTRA = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
}


def obtener_content_type(ruta: Path) -> str:
    ext = ruta.suffix.lower()
    if ext in MAPA_MIME_EXTRA:
        return MAPA_MIME_EXTRA[ext]
    guess, _ = mimetypes.guess_type(ruta.name)
    return guess or "application/octet-stream"


def limpiar_bucket_anterior(s3: any, bucket_viejo: str) -> None:
    """Elimina el bucket anterior 'abarrotesiq-pos-judith' si existe para mantener limpia la cuenta."""
    try:
        s3.head_bucket(Bucket=bucket_viejo)
        objs = s3.list_objects_v2(Bucket=bucket_viejo).get("Contents", [])
        for obj in objs:
            s3.delete_object(Bucket=bucket_viejo, Key=obj["Key"])
        s3.delete_bucket(Bucket=bucket_viejo)
        print(f"🧹 Bucket anterior '{bucket_viejo}' eliminado para mantener limpia tu cuenta.")
    except Exception:
        pass


def asegurar_bucket_web(s3: any, region: str) -> str:
    """Crea o reutiliza el bucket 'abarrotes-iq' (o 'abarrotes-iq-cloud' si el nombre global ya está tomado en AWS)."""
    preferido = os.getenv("AWS_S3_WEB_BUCKET", "abarrotes-iq").strip()
    candidatos = [preferido, "abarrotes-iq-app", "abarrotes-iq-cloud"]

    for nombre in candidatos:
        try:
            s3.head_bucket(Bucket=nombre)
            return nombre
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code in ("404", "NoSuchBucket"):
                try:
                    if region == "us-east-1":
                        s3.create_bucket(Bucket=nombre)
                    else:
                        s3.create_bucket(
                            Bucket=nombre,
                            CreateBucketConfiguration={"LocationConstraint": region},
                        )
                    return nombre
                except ClientError:
                    continue
            else:
                # 403 significa que otro usuario de AWS en el mundo ya registró ese nombre exacto
                continue
    raise RuntimeError("No fue posible crear el bucket S3 para la web.")


def desplegar_web_en_aws_s3() -> str:
    dist_dir = RAIZ / "dist"
    app_js = dist_dir / "assets" / "app.js"
    if not app_js.exists() or app_js.stat().st_size < 900_000:
        esbuild_exe = RAIZ / "node_modules" / "@esbuild" / "win32-x64" / "esbuild.exe"
        if esbuild_exe.exists():
            (dist_dir / "assets").mkdir(parents=True, exist_ok=True)
            subprocess.run(
                [
                    str(esbuild_exe),
                    str(RAIZ / "src" / "main.tsx"),
                    "--bundle",
                    "--format=iife",
                    "--jsx=automatic",
                    "--minify",
                    "--conditions=style",
                    f"--outfile={app_js}",
                ],
                cwd=str(RAIZ),
                check=True,
            )

    ak = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
    sk = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
    region = os.getenv("AWS_DEFAULT_REGION", "us-east-1").strip()

    if not (ak and sk):
        raise RuntimeError("Faltan AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY en tu archivo .env")

    s3 = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=ak,
        aws_secret_access_key=sk,
    )

    limpiar_bucket_anterior(s3, "abarrotesiq-pos-judith")

    print("☁️ 1/4 Configurando bucket en AWS S3...")
    web_bucket = asegurar_bucket_web(s3, region)
    print(f"   ✅ Bucket activo: s3://{web_bucket} ({region})")

    print("🔓 2/4 Habilitando Static Website Hosting en S3...")
    s3.put_public_access_block(
        Bucket=web_bucket,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": False,
            "IgnorePublicAcls": False,
            "BlockPublicPolicy": False,
            "RestrictPublicBuckets": False,
        },
    )

    politica_lectura_web = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "LecturaPublicaAbarrotesIQ",
                "Effect": "Allow",
                "Principal": "*",
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{web_bucket}/*"],
            }
        ],
    }
    s3.put_bucket_policy(Bucket=web_bucket, Policy=json.dumps(politica_lectura_web))
    s3.put_bucket_website(
        Bucket=web_bucket,
        WebsiteConfiguration={
            "IndexDocument": {"Suffix": "index.html"},
            "ErrorDocument": {"Key": "index.html"},
        },
    )

    print("🚀 3/4 Subiendo Punto de Venta + Dashboard autocontenido a Amazon S3...")
    archivos_subidos = 0
    bytes_totales = 0
    for archivo in dist_dir.rglob("*"):
        if archivo.is_file():
            rel_key = archivo.relative_to(dist_dir).as_posix()
            ctype = obtener_content_type(archivo)
            s3.upload_file(
                str(archivo),
                web_bucket,
                rel_key,
                ExtraArgs={"ContentType": ctype, "CacheControl": "no-cache"},
            )
            archivos_subidos += 1
            bytes_totales += archivo.stat().st_size

    url_aws = f"http://{web_bucket}.s3-website-{region}.amazonaws.com"
    mb_totales = bytes_totales / (1024 * 1024)
    print("=" * 78)
    print(f"✅ 4/4 ¡DESPLIEGUE EN AWS COMPLETADO CON ÉXITO! ({archivos_subidos} archivos, {mb_totales:.2f} MB)")
    print(f"💰 Costo en AWS: $0.00 USD (Usa {mb_totales:.2f} MB de tus 5,000 MB gratis en S3)")
    print(f"🌐 Abre tu URL Pública de AWS aquí:")
    print(f"   👉 {url_aws}")
    print("=" * 78)
    return url_aws


if __name__ == "__main__":
    desplegar_web_en_aws_s3()
