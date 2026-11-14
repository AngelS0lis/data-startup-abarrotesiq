"""Microservicio de Ingesta (FastAPI) para AbarrotesIQ — Entregable E2.

Recibe registros individuales por POST (/ingesta/registro) o lotes CSV (/ingesta/csv),
valida la estructura de entrada con Pydantic, guarda el archivo en la zona raw/ del
Data Lake (Amazon S3 + respaldo local) y publica un mensaje asíncrono en la cola
administrada Amazon SQS para que el Worker lo limpie y cargue en clean/ y PostgreSQL
sin bloquear al usuario.
"""

from __future__ import annotations

import io
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import boto3
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field, field_validator

RAIZ = Path(__file__).resolve().parents[2]
load_dotenv(RAIZ / ".env")

app = FastAPI(
    title="AbarrotesIQ · API de Ingesta Asíncrona (E2)",
    description=(
        "Microservicio FastAPI para recepción de gastos a proveedores y tickets del POS de "
        "**Abarrotes 'Judith'**. Guarda en `raw/` (Amazon S3) y encola eventos en **Amazon SQS**."
    ),
    version="2.0.0",
)


class RegistroGastoIn(BaseModel):
    tipo_gasto: str = Field(..., min_length=2, max_length=80, examples=["bolillo"])
    monto_gasto: float = Field(..., gt=0, le=50000, examples=[630.0])
    fecha: str = Field(..., pattern=r"^\d{2}/\d{2}/\d{4}$", examples=["24/10/2026"])
    turno: Optional[str] = Field(default="Matutino", examples=["Matutino"])

    @field_validator("tipo_gasto")
    @classmethod
    def limpiar_nombre(cls, v: str) -> str:
        limpio = v.strip().lower()
        if not limpio:
            raise ValueError("El nombre del insumo/proveedor no puede estar vacío.")
        return limpio


def publicar_en_s3_y_sqs(contenido_csv: bytes, s3_raw_key: str, origen_tipo: str, num_filas: int) -> dict:
    """Guarda el objeto crudo en S3 raw/ (o local) y publica el evento en Amazon SQS."""
    bucket = os.getenv("AWS_S3_BUCKET", "").strip()
    sqs_url = os.getenv("AWS_SQS_QUEUE_URL", "").strip()
    region = os.getenv("AWS_DEFAULT_REGION", "us-east-1").strip()
    tiene_aws = bool(bucket and os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"))

    mensaje_id = f"msg-{uuid.uuid4().hex[:12]}"
    evento = {
        "mensaje_id": mensaje_id,
        "evento": "NUEVA_INGESTA_RAW",
        "origen": origen_tipo,
        "bucket": bucket or "local-datalake",
        "raw_key": s3_raw_key,
        "registros_recibidos": int(num_filas),
        "intento": 1,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }

    s3_subido = False
    sqs_enviado = False

    if tiene_aws:
        try:
            s3 = boto3.client("s3", region_name=region)
            s3.put_object(Bucket=bucket, Key=s3_raw_key, Body=contenido_csv, ContentType="text/csv")
            s3_subido = True
        except Exception as exc:
            evento["aviso_s3"] = str(exc)

        if sqs_url:
            try:
                sqs = boto3.client("sqs", region_name=region)
                resp = sqs.send_message(
                    QueueUrl=sqs_url,
                    MessageBody=json.dumps(evento, ensure_ascii=False),
                )
                evento["sqs_message_id"] = resp.get("MessageId", mensaje_id)
                sqs_enviado = True
            except Exception as exc:
                evento["aviso_sqs"] = str(exc)

    # Respaldo en cola local para garantizar funcionamiento híbrido (nube + local)
    ruta_cola_local = RAIZ / "data" / "raw" / "cola_sqs_local.jsonl"
    ruta_cola_local.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta_cola_local, "a", encoding="utf-8") as f_q:
        f_q.write(json.dumps(evento, ensure_ascii=False) + "\n")

    return {
        "status": "ENCOLADO",
        "mensaje_id": mensaje_id,
        "s3_raw_uri": f"s3://{bucket}/{s3_raw_key}" if s3_subido else f"local://data/{s3_raw_key}",
        "cola_destino": sqs_url if sqs_enviado else "cola_sqs_local.jsonl (Fallback)",
        "evento": evento,
    }


@app.get("/health", tags=["Monitoreo"])
def health_check():
    """Verifica el estado del microservicio de ingesta y la configuración de AWS S3 / SQS."""
    return {
        "servicio": "abarrotesiq-ingesta-api",
        "estado": "OK",
        "version": "2.0.0",
        "s3_bucket_configurado": bool(os.getenv("AWS_S3_BUCKET")),
        "sqs_cola_configurada": bool(os.getenv("AWS_SQS_QUEUE_URL")),
    }


@app.post("/ingesta/registro", status_code=status.HTTP_202_ACCEPTED, tags=["Ingesta Asíncrona"])
def ingestar_registro_individual(registro: RegistroGastoIn):
    """Recibe un registro individual por POST, lo agrega al CSV crudo de la libreta,
    lo respalda en `raw/` y publica un mensaje asíncrono en la cola SQS.
    """
    ruta_libreta = RAIZ / "data" / "raw" / "gastos_proveedores_libreta1.csv"
    nueva_linea = f"\n{registro.tipo_gasto},{registro.monto_gasto},{registro.fecha}"
    with open(ruta_libreta, "a", encoding="utf-8") as f:
        f.write(nueva_linea)

    contenido_bytes = ruta_libreta.read_bytes()
    s3_key = "raw/gastos_proveedores_libreta1.csv"
    resultado = publicar_en_s3_y_sqs(
        contenido_csv=contenido_bytes,
        s3_raw_key=s3_key,
        origen_tipo="POST_REGISTRO_INDIVIDUAL",
        num_filas=1,
    )
    return resultado


@app.post("/ingesta/csv", status_code=status.HTTP_202_ACCEPTED, tags=["Ingesta Asíncrona"])
async def ingestar_archivo_csv(archivo: UploadFile = File(...)):
    """Recibe un archivo CSV por POST, valida que contenga las columnas requeridas
    (`tipo_gasto`, `monto_gasto`, `fecha`), lo almacena en `raw/` y publica un mensaje en SQS.
    """
    if not archivo.filename or not archivo.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo subido debe tener extensión .csv",
        )

    contenido = await archivo.read()
    try:
        df_subido = pd.read_csv(io.BytesIO(contenido))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No fue posible parsear el archivo CSV: {exc}",
        )

    cols_requeridas = {"tipo_gasto", "monto_gasto", "fecha"}
    cols_archivo = {c.strip().lower() for c in df_subido.columns}
    if not cols_requeridas.issubset(cols_archivo):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"El CSV debe incluir las columnas {sorted(cols_requeridas)}. Recibidas: {list(df_subido.columns)}",
        )

    # Guardar en data/raw/ local y preparar subida a S3 raw/
    ruta_libreta = RAIZ / "data" / "raw" / "gastos_proveedores_libreta1.csv"
    df_subido_limpio = df_subido[["tipo_gasto", "monto_gasto", "fecha"]].dropna(how="all")
    df_subido_limpio.to_csv(ruta_libreta, index=False)

    s3_key = "raw/gastos_abarrotes_raw.csv"
    resultado = publicar_en_s3_y_sqs(
        contenido_csv=ruta_libreta.read_bytes(),
        s3_raw_key=s3_key,
        origen_tipo=f"POST_CSV:{archivo.filename}",
        num_filas=len(df_subido_limpio),
    )
    return resultado
