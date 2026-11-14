"""Pruebas unitarias automatizadas para el módulo de limpieza y regresión (Entregable E2).

Ejecución:
    py -3.11 -m pytest tests/test_limpieza.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "services" / "worker"))
sys.path.insert(0, str(RAIZ / "services" / "modelos"))

from limpieza import limpiar_dataset
from series_y_regresion import regresion_ecuacion_normal_numpy, calcular_metricas_regresion


def crear_df_prueba_con_5_errores() -> pd.DataFrame:
    """Construye un DataFrame sintético que contiene explícitamente los 5 tipos de error
    de la Unidad 1 (duplicados, faltantes, tipos/sinónimos, errores lógicos y atípicos).
    """
    filas = [
        # Registros base normales de bolillo (mediana = 630)
        {"tipo_gasto": "bolillo", "monto_gasto": 630.0, "fecha": "05/06/2026", "precio_unitario": 7.0, "unidades": 90, "libreta_origen": "Libreta_1", "turno": "Matutino"},
        {"tipo_gasto": "bolillo", "monto_gasto": 630.0, "fecha": "06/06/2026", "precio_unitario": 7.0, "unidades": 90, "libreta_origen": "Libreta_1", "turno": "Matutino"},
        {"tipo_gasto": "bolillo", "monto_gasto": 644.0, "fecha": "08/06/2026", "precio_unitario": 7.0, "unidades": 92, "libreta_origen": "Libreta_1", "turno": "Matutino"},
        # 1. DUPLICADO EXACTO de la fila anterior
        {"tipo_gasto": "bolillo", "monto_gasto": 644.0, "fecha": "08/06/2026", "precio_unitario": 7.0, "unidades": 92, "libreta_origen": "Libreta_1", "turno": "Matutino"},
        # 2. VALOR FALTANTE (NaN en monto_gasto y unidades)
        {"tipo_gasto": "bolillo", "monto_gasto": np.nan, "fecha": "09/06/2026", "precio_unitario": 7.0, "unidades": np.nan, "libreta_origen": "Libreta_1", "turno": "Matutino"},
        # 3. ERROR DE FORMATO, SINÓNIMO ('tomales' -> 'tamales') Y FECHA TRUNCADA ('28/2026' -> '28/08/2026')
        {"tipo_gasto": "  TOMALES ", "monto_gasto": 70.0, "fecha": "28/2026", "precio_unitario": 14.0, "unidades": 5, "libreta_origen": "Libreta_2", "turno": "Vespertino"},
        # 4. ERROR LÓGICO (monto y unidades negativas)
        {"tipo_gasto": "tortillas_mirador", "monto_gasto": -504.0, "fecha": "10/06/2026", "precio_unitario": 28.0, "unidades": -18, "libreta_origen": "Libreta_1", "turno": "Matutino"},
        # 5. VALOR ATÍPICO EXTREMO DE CAPTURA (999 unidades / $9,990 MXN)
        {"tipo_gasto": "bolillo", "monto_gasto": 9990.0, "fecha": "11/06/2026", "precio_unitario": 7.0, "unidades": 999, "libreta_origen": "Libreta_1", "turno": "Matutino"},
    ]
    df = pd.DataFrame(filas)
    df["columna_vacia_csv"] = np.nan
    return df


def test_limpieza_corrige_los_5_tipos_de_error():
    df_raw = crear_df_prueba_con_5_errores()
    df_clean, rep = limpiar_dataset(df_raw)

    assert rep["columnas_vacias_eliminadas"] == 1
    assert rep["duplicados_eliminados"] == 1
    assert rep["faltantes_corregidos"] >= 2
    assert rep["tipos_y_formato_corregidos"] >= 2
    assert rep["errores_logicos_corregidos"] == 2
    assert rep["atipicos_corregidos"] == 1
    assert len(df_clean) == 7

    # Sin valores nulos ni negativos ni atípicos 9990
    assert int(df_clean["monto_gasto"].isna().sum()) == 0
    assert int((df_clean["monto_gasto"] <= 0).sum()) == 0
    assert float(df_clean["monto_gasto"].max()) < 3000.0
    # Sinónimo 'tomales' homologado a 'tamales'
    assert "tamales" in df_clean["tipo_gasto"].values
    assert "tomales" not in df_clean["tipo_gasto"].values


def test_regresion_ecuacion_normal_coincide_con_minimos_cuadrados():
    rng = np.random.default_rng(123)
    X = rng.uniform(1, 50, size=(80, 3))
    beta_verdadero = np.array([15.0, 4.5, -2.0, 0.8])
    y = beta_verdadero[0] + X @ beta_verdadero[1:] + rng.normal(0, 0.5, size=80)

    beta_np, y_hat = regresion_ecuacion_normal_numpy(X, y)
    X_b = np.column_stack([np.ones(len(X)), X])
    beta_svd = np.linalg.lstsq(X_b, y, rcond=None)[0]

    assert np.allclose(beta_np, beta_svd, atol=1e-9)
    metricas = calcular_metricas_regresion(y, y_hat)
    assert metricas["R2"] > 0.99
