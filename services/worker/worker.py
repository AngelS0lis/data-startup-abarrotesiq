"""Worker Asíncrono de Limpieza y Persistencia para AbarrotesIQ — Entregable E2.

Consume mensajes de Amazon SQS (o de la cola local de respaldo), ejecuta el módulo
de limpieza automatizada (`limpieza.py`), publica los datos depurados en `clean/`
de Amazon S3 y los inserta en la base de datos relacional PostgreSQL (`db.py`).
Implementa control de reintentos (máximo 3 intentos) y desvío a Dead-Letter Queue (DLQ).
"""

from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

import boto3
from dotenv import load_dotenv

from db import guardar_en_base_de_datos
from limpieza import generar_raw_enriquecido, limpiar_dataset
from s3_datalake import subir_datalake_s3

RAIZ = Path(__file__).resolve().parents[2]
load_dotenv(RAIZ / ".env")

MAX_REINTENTOS = 3


def enviar_a_dlq(evento: Dict[str, Any], error_msg: str) -> None:
    """Envía un mensaje que falló tras MAX_REINTENTOS a la cola de mensajes fallidos (DLQ)."""
    dlq_url = os.getenv("AWS_SQS_DLQ_URL", "").strip()
    region = os.getenv("AWS_DEFAULT_REGION", "us-east-1").strip()
    registro_dlq = {
        "evento_original": evento,
        "error": error_msg,
        "enviado_a_dlq_en": datetime.now(timezone.utc).isoformat(),
    }

    if dlq_url and os.getenv("AWS_ACCESS_KEY_ID"):
        try:
            sqs = boto3.client("sqs", region_name=region)
            sqs.send_message(QueueUrl=dlq_url, MessageBody=json.dumps(registro_dlq, ensure_ascii=False))
        except Exception as exc:
            print(f"[WARN] No se pudo enviar a SQS DLQ remoto: {exc}")

    ruta_dlq_local = RAIZ / "data" / "raw" / "cola_dlq_local.jsonl"
    ruta_dlq_local.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta_dlq_local, "a", encoding="utf-8") as f_dlq:
        f_dlq.write(json.dumps(registro_dlq, ensure_ascii=False) + "\n")
    print(f"[DLQ] Mensaje {evento.get('mensaje_id')} movido a la Dead-Letter Queue: {error_msg}")


def procesar_mensaje(evento: Dict[str, Any]) -> Dict[str, Any]:
    """Ejecuta el flujo completo del Worker para un mensaje de la cola:
    1. Lee raw/ y ejecuta limpieza automatizada (limpieza.py).
    2. Sube archivos depurados a S3 clean/ (s3_datalake.py).
    3. Inserta registros limpios en PostgreSQL / SQLite (db.py).
    """
    inicio = time.perf_counter()
    path_libreta = RAIZ / "data" / "raw" / "gastos_proveedores_libreta1.csv"
    path_raw = RAIZ / "data" / "raw" / "gastos_abarrotes_raw.csv"
    path_clean = RAIZ / "data" / "clean" / "gastos_abarrotes_clean.csv"
    path_reporte = RAIZ / "data" / "clean" / "reporte_limpieza_e1.json"

    df_raw = generar_raw_enriquecido(path_libreta, path_raw)
    df_clean, reporte = limpiar_dataset(df_raw)

    path_clean.parent.mkdir(parents=True, exist_ok=True)
    df_clean.to_csv(path_clean, index=False)
    with open(path_reporte, "w", encoding="utf-8") as f_rep:
        json.dump(reporte, f_rep, indent=2, ensure_ascii=False)

    # Subir a Amazon S3 (raw/ y clean/) si las credenciales están activas
    subir_datalake_s3()

    # Guardar en base de datos relacional (PostgreSQL / SQLite ACID)
    res_bd = guardar_en_base_de_datos(
        df_clean=df_clean,
        reporte=reporte,
        archivo_origen=str(evento.get("raw_key", "raw/gastos_abarrotes_raw.csv")),
    )

    duracion_seg = round(time.perf_counter() - inicio, 3)
    resumen = {
        "mensaje_id": evento.get("mensaje_id", "manual"),
        "registros_limpios": reporte["registros_finales_limpios"],
        "correcciones_aplicadas": reporte["total_correcciones_aplicadas"],
        "base_de_datos": res_bd,
        "duracion_segundos": duracion_seg,
    }
    print(f"[WORKER OK] Procesado en {duracion_seg}s -> {json.dumps(resumen, ensure_ascii=False)}")
    return resumen


def consumir_ciclo_cola() -> int:
    """Consume mensajes pendientes de Amazon SQS (si está configurado) y de la cola local."""
    procesados = 0
    sqs_url = os.getenv("AWS_SQS_QUEUE_URL", "").strip()
    region = os.getenv("AWS_DEFAULT_REGION", "us-east-1").strip()

    # 1. Consumir desde Amazon SQS si está configurado
    if sqs_url and os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
        try:
            sqs = boto3.client("sqs", region_name=region)
            resp = sqs.receive_message(
                QueueUrl=sqs_url,
                MaxNumberOfMessages=5,
                WaitTimeSeconds=2,
                VisibilityTimeout=30,
                AttributeNames=["ApproximateReceiveCount"],
            )
            for msg in resp.get("Messages", []):
                receipt = msg["ReceiptHandle"]
                intentos = int(msg.get("Attributes", {}).get("ApproximateReceiveCount", "1"))
                try:
                    evento = json.loads(msg["Body"])
                    procesar_mensaje(evento)
                    sqs.delete_message(QueueUrl=sqs_url, ReceiptHandle=receipt)
                    procesados += 1
                except Exception as exc:
                    print(f"[ERROR WORKER SQS] Intento {intentos}/{MAX_REINTENTOS}: {exc}")
                    if intentos >= MAX_REINTENTOS:
                        enviar_a_dlq({"raw_body": msg["Body"]}, str(exc))
                        sqs.delete_message(QueueUrl=sqs_url, ReceiptHandle=receipt)
        except Exception as exc:
            print(f"[WARN] Error consultando cola SQS remota: {exc}")

    # 2. Consumir desde cola local de respaldo (cola_sqs_local.jsonl)
    ruta_cola_local = RAIZ / "data" / "raw" / "cola_sqs_local.jsonl"
    if ruta_cola_local.exists():
        lineas = [l.strip() for l in ruta_cola_local.read_text(encoding="utf-8").splitlines() if l.strip()]
        if lineas:
            ruta_cola_local.unlink()
            for linea in lineas:
                evento = json.loads(linea)
                for intento in range(1, MAX_REINTENTOS + 1):
                    try:
                        procesar_mensaje(evento)
                        procesados += 1
                        break
                    except Exception as exc:
                        if intento == MAX_REINTENTOS:
                            enviar_a_dlq(evento, str(exc))

    return procesados


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Worker asíncrono de limpieza y carga AbarrotesIQ (E2)")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Ejecuta una corrida inmediata de extremo a extremo (raw -> clean -> S3 & BD) y termina.",
    )
    args = parser.parse_args()

    if args.once:
        n_proc = consumir_ciclo_cola()
        if n_proc == 0:
            procesar_mensaje({"mensaje_id": "ejecucion-directa-e2", "raw_key": "raw/gastos_abarrotes_raw.csv"})
    else:
        print("🚀 Worker AbarrotesIQ (E2) escuchando mensajes en cola SQS / local...")
        while True:
            consumir_ciclo_cola()
            time.sleep(5)
