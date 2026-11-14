"""Capa de persistencia relacional para el Worker de AbarrotesIQ (Entregable E2).

Soporta:
- PostgreSQL administrado (Amazon RDS) o en contenedor Docker mediante DATABASE_URL
  (ej. postgresql+psycopg2://abarrotes:secret@localhost:5432/abarrotesiq_db).
- Fallback automático a SQLite local (data/clean/abarrotesiq.db) con la misma
  estructura de tablas e índices para pruebas locales sin costo.
"""

from __future__ import annotations

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

import pandas as pd
from dotenv import load_dotenv

RAIZ = Path(__file__).resolve().parents[2]
load_dotenv(RAIZ / ".env")


def obtener_url_bd() -> str:
    """Obtiene la cadena de conexión desde variables de entorno (fuera del código)."""
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    ruta_sqlite = RAIZ / "data" / "clean" / "abarrotesiq.db"
    ruta_sqlite.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{ruta_sqlite.as_posix()}"


def guardar_en_base_de_datos(
    df_clean: pd.DataFrame,
    reporte: Dict[str, Any],
    archivo_origen: str = "raw/gastos_abarrotes_raw.csv",
) -> Dict[str, Any]:
    """Escribe el DataFrame limpio y el registro de auditoría dentro de una
    transacción ACID en PostgreSQL (si DATABASE_URL apunta a Postgres) o SQLite local.
    """
    db_url = obtener_url_bd()
    lote_id = f"lote-{uuid.uuid4().hex[:12]}"
    ahora_iso = datetime.now(timezone.utc).isoformat()

    if db_url.startswith("postgresql"):
        from sqlalchemy import create_engine, text

        engine = create_engine(db_url, pool_pre_ping=True)
        schema_sql = (Path(__file__).resolve().parent / "schema.sql").read_text(encoding="utf-8")
        with engine.begin() as conn:
            for stmt in schema_sql.split(";"):
                if stmt.strip():
                    conn.execute(text(stmt))
            conn.execute(text("TRUNCATE TABLE gastos_proveedores_clean RESTART IDENTITY;"))
            df_clean.to_sql(
                "gastos_proveedores_clean",
                con=conn,
                if_exists="append",
                index=False,
                method="multi",
            )
            conn.execute(
                text(
                    """
                    INSERT INTO auditoria_ingesta
                        (lote_id, archivo_origen, registros_iniciales, registros_limpios, total_correcciones, estado)
                    VALUES
                        (:lote_id, :archivo, :ini, :fin, :corr, 'COMPLETADO')
                    """
                ),
                {
                    "lote_id": lote_id,
                    "archivo": archivo_origen,
                    "ini": int(reporte.get("registros_iniciales", len(df_clean))),
                    "fin": int(reporte.get("registros_finales_limpios", len(df_clean))),
                    "corr": int(reporte.get("total_correcciones_aplicadas", 0)),
                },
            )
        motor_usado = "PostgreSQL (ACID)"
    else:
        ruta_db = RAIZ / "data" / "clean" / "abarrotesiq.db"
        ruta_db.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(ruta_db) as conn:
            df_clean.to_sql("gastos_proveedores_clean", conn, if_exists="replace", index=False)
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS auditoria_ingesta (
                    lote_id TEXT PRIMARY KEY,
                    archivo_origen TEXT NOT NULL,
                    registros_iniciales INTEGER NOT NULL,
                    registros_limpios INTEGER NOT NULL,
                    total_correcciones INTEGER NOT NULL,
                    estado TEXT NOT NULL,
                    procesado_en TEXT NOT NULL
                );
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos_proveedores_clean (fecha);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_gastos_tipo_gasto ON gastos_proveedores_clean (tipo_gasto);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos_proveedores_clean (categoria);")
            conn.execute(
                """
                INSERT INTO auditoria_ingesta
                    (lote_id, archivo_origen, registros_iniciales, registros_limpios, total_correcciones, estado, procesado_en)
                VALUES (?, ?, ?, ?, ?, 'COMPLETADO', ?)
                """,
                (
                    lote_id,
                    archivo_origen,
                    int(reporte.get("registros_iniciales", len(df_clean))),
                    int(reporte.get("registros_finales_limpios", len(df_clean))),
                    int(reporte.get("total_correcciones_aplicadas", 0)),
                    ahora_iso,
                ),
            )
            conn.commit()
        motor_usado = f"SQLite/PostgreSQL Compatible ({ruta_db.name})"

    return {
        "lote_id": lote_id,
        "motor_bd": motor_usado,
        "registros_insertados": int(len(df_clean)),
        "timestamp": ahora_iso,
    }
