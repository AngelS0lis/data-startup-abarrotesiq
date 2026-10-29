"""Script de gestión del Data Lake en Amazon S3 para AbarrotesIQ (E1 - Tema 2.4).

Ejecuta el pipeline de preprocesamiento sobre los datos reales de Abarrotes "Judith"
y sube automáticamente los objetos a las dos zonas obligatorias del bucket S3:
- s3://<AWS_S3_BUCKET>/raw/gastos_abarrotes_raw.csv
- s3://<AWS_S3_BUCKET>/clean/gastos_abarrotes_clean.csv
- s3://<AWS_S3_BUCKET>/clean/reporte_limpieza_e1.json

Uso:
    python services/worker/s3_datalake.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

from limpieza import generar_raw_enriquecido, limpiar_dataset


def sincronizar_datalake_s3() -> None:
    raiz = Path(__file__).resolve().parents[2]
    load_dotenv(raiz / ".env")

    path_orig = raiz / "data" / "raw" / "gastos_proveedores_libreta1.csv"
    path_raw = raiz / "data" / "raw" / "gastos_abarrotes_raw.csv"
    path_clean = raiz / "data" / "clean" / "gastos_abarrotes_clean.csv"
    path_reporte = raiz / "data" / "clean" / "reporte_limpieza_e1.json"

    print("1. Generando dataset crudo (raw/) y ejecutando limpieza de los 5 tipos de error...")
    df_raw = generar_raw_enriquecido(path_orig, path_raw)
    df_clean, reporte = limpiar_dataset(df_raw)

    path_clean.parent.mkdir(parents=True, exist_ok=True)
    df_clean.to_csv(path_clean, index=False)
    with open(path_reporte, "w", encoding="utf-8") as f:
        json.dump(reporte, f, indent=2, ensure_ascii=False)

    print("   Reporte de limpieza generado:")
    for k, v in reporte.items():
        print(f"   - {k}: {v}")

    bucket_name = os.getenv("AWS_S3_BUCKET", "").strip()
    region = os.getenv("AWS_DEFAULT_REGION", "us-east-1").strip()

    if not bucket_name:
        print(
            "\n[AVISO] No se encontró la variable AWS_S3_BUCKET en tu archivo .env."
            "\nLos archivos locales ya están listos en data/raw/ y data/clean/."
            "\nConfigura tu archivo .env y vuelve a correr este script para subirlos a Amazon S3."
        )
        return

    print(f"\n2. Conectando a Amazon S3 (Bucket: {bucket_name}, Región: {region})...")
    try:
        s3 = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

        objetos = [
            (path_raw, "raw/gastos_abarrotes_raw.csv", "text/csv"),
            (path_clean, "clean/gastos_abarrotes_clean.csv", "text/csv"),
            (path_reporte, "clean/reporte_limpieza_e1.json", "application/json"),
        ]

        for archivo_local, s3_key, content_type in objetos:
            s3.upload_file(
                str(archivo_local),
                bucket_name,
                s3_key,
                ExtraArgs={"ContentType": content_type},
            )
            print(f"   ✅ Subido con éxito: s3://{bucket_name}/{s3_key}")

        print("\n🎉 Data Lake en Amazon S3 actualizado exitosamente (zonas raw/ y clean/).")

    except (BotoCoreError, ClientError) as exc:
        print(f"\n❌ Error al conectar o subir a Amazon S3: {exc}")


if __name__ == "__main__":
    sincronizar_datalake_s3()
