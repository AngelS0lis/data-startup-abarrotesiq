"""Suite de Pruebas Automatizadas para Transformaciones de Datos y Endpoints FastAPI en CI/CD.

Valida integralmente:
1. Transformaciones del pipeline de datos (`limpieza.py`, `series_y_regresion.py`, `entrenar_modelos.py`).
2. Endpoints y validadores Pydantic del Microservicio de Ingesta (`services/ingesta/main.py`):
   - GET  /health
   - POST /ingesta/registro (validación Pydantic para registros válidos y rechazo de montos negativos / fechas inválidas)
   - POST /ingesta/csv (validación de extensión .csv y columnas requeridas)
3. Endpoints y esquemas del Microservicio de Modelos Predictivos (`services/modelos/main.py`):
   - GET  /health
   - GET  /pronostico (horizontes de 7, 14 y 30 días, verificando banda de confianza al 95%)
   - POST /pronostico
   - POST /clasificar (validando inferencia con los 4 modelos: Árbol, Naive Bayes, SVM y KNN)
   - GET  /metricas (verificando tabla AIC de ARIMA/SARIMA y Matrices de Confusión, Precisión, Recall y F1)

Ejecución en local y en CI/CD (GitHub Actions):
    py -3.11 -m pytest tests/ -v
"""

from __future__ import annotations

import asyncio
import importlib.util
import io
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from fastapi import HTTPException, UploadFile
from pydantic import ValidationError

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "services" / "worker"))
sys.path.insert(0, str(RAIZ / "services" / "modelos"))


def cargar_modulo_desde_archivo(nombre_modulo: str, ruta_archivo: Path):
    """Carga un módulo FastAPI por ruta absoluta y lo registra en sys.modules para Pydantic v2."""
    spec = importlib.util.spec_from_file_location(nombre_modulo, ruta_archivo)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[nombre_modulo] = mod
    spec.loader.exec_module(mod)
    return mod


mod_ingesta = cargar_modulo_desde_archivo("ingesta_main", RAIZ / "services" / "ingesta" / "main.py")
mod_modelos = cargar_modulo_desde_archivo("modelos_main", RAIZ / "services" / "modelos" / "main.py")


# ==============================================================================
# 1. PRUEBAS DE TRANSFORMACIÓN DE DATOS Y SERIES / MODELOS
# ==============================================================================
def test_transformaciones_dataset_limpio_cumple_esquema_y_calidad():
    """Verifica que el dataset limpio de Abarrotes 'Judith' cumpla las invariantes de negocio."""
    ruta_clean = RAIZ / "data" / "clean" / "gastos_abarrotes_clean.csv"
    assert ruta_clean.exists(), "El archivo clean/gastos_abarrotes_clean.csv debe existir"
    df = pd.read_csv(ruta_clean)

    assert len(df) >= 1500
    columnas_esperadas = {
        "fecha", "tipo_gasto", "categoria", "libreta_origen", "turno",
        "unidades", "precio_unitario", "monto_gasto", "dia_semana_num",
        "dia_semana", "dia_mes", "mes", "es_quincena", "semana_anio",
        "frecuencia_proveedor", "alerta_gasto_alto",
    }
    assert columnas_esperadas.issubset(set(df.columns))

    assert int(df.isna().sum().sum()) == 0
    assert (df["monto_gasto"] > 0).all()
    assert (df["unidades"] > 0).all()
    assert set(df["alerta_gasto_alto"].unique()).issubset({0, 1})


def test_descomposicion_y_adf_serie_tiempo():
    """Valida que la descomposición aditiva Y = T + S + R reconstruya exactamente la serie observada."""
    from series_y_regresion import descomponer_serie_tiempo, prueba_adf_estacionariedad

    df = pd.read_csv(RAIZ / "data" / "clean" / "gastos_abarrotes_clean.csv")
    df_desc = descomponer_serie_tiempo(df, periodo=7)
    reconstruccion = df_desc["tendencia"] + df_desc["estacionalidad"] + df_desc["residuo"]
    assert np.allclose(df_desc["observado"].values, reconstruccion.values, atol=1e-6)

    res_adf = prueba_adf_estacionariedad(df_desc["observado"])
    assert res_adf["estadistico_adf"] < -2.88
    assert res_adf["es_estacionaria_al_5pct"] is True


# ==============================================================================
# 2. PRUEBAS DE ENDPOINTS FASTAPI — MICROSERVICIO DE INGESTA (E2 / E3)
# ==============================================================================
def test_ingesta_rutas_y_health_check():
    rutas = {getattr(r, "path", "") for r in mod_ingesta.app.routes}
    assert {"/health", "/ingesta/registro", "/ingesta/csv"}.issubset(rutas)

    datos = mod_ingesta.health_check()
    assert datos["servicio"] == "abarrotesiq-ingesta-api"
    assert datos["estado"] == "OK"


def test_ingesta_registro_rechaza_datos_invalidos():
    """Verifica que el esquema Pydantic de FastAPI rechace montos negativos y fechas mal formadas."""
    with pytest.raises(ValidationError):
        mod_ingesta.RegistroGastoIn(tipo_gasto="bolillo", monto_gasto=-150.0, fecha="24/10/2026")

    with pytest.raises(ValidationError):
        mod_ingesta.RegistroGastoIn(tipo_gasto="bolillo", monto_gasto=500.0, fecha="2026-10-24")

    reg_valido = mod_ingesta.RegistroGastoIn(tipo_gasto="  BOLILLO ", monto_gasto=630.0, fecha="24/10/2026")
    assert reg_valido.tipo_gasto == "bolillo"


def test_ingesta_csv_rechaza_extension_y_columnas_faltantes():
    """Verifica que POST /ingesta/csv valide extensión .csv (400) y columnas requeridas (422)."""
    archivo_txt = UploadFile(filename="notas.txt", file=io.BytesIO(b"hola,mundo"))
    with pytest.raises(HTTPException) as exc_txt:
        asyncio.run(mod_ingesta.ingestar_archivo_csv(archivo=archivo_txt))
    assert exc_txt.value.status_code == 400

    archivo_malo = UploadFile(filename="malo.csv", file=io.BytesIO(b"producto,costo\nbolillo,630\n"))
    with pytest.raises(HTTPException) as exc_cols:
        asyncio.run(mod_ingesta.ingestar_archivo_csv(archivo=archivo_malo))
    assert exc_cols.value.status_code == 422


# ==============================================================================
# 3. PRUEBAS DE ENDPOINTS FASTAPI — MICROSERVICIO DE MODELOS (E3)
# ==============================================================================
def test_modelos_rutas_y_health_check():
    rutas = {getattr(r, "path", "") for r in mod_modelos.app.routes}
    assert {"/health", "/pronostico", "/clasificar", "/metricas"}.issubset(rutas)

    data = mod_modelos.health_check()
    assert data["servicio"] == "abarrotesiq-modelos-api"
    assert data["estado"] == "OK"
    assert "SARIMA" in data["modelo_pronostico_activo"]


@pytest.mark.parametrize("horizonte", [7, 14, 30])
def test_modelos_pronostico_horizonte_y_banda_confianza(horizonte: int):
    """Verifica que /pronostico devuelva exactamente `horizonte` días con IC 95% coherente."""
    data = mod_modelos.obtener_pronostico(horizonte_dias=horizonte)
    assert data["horizonte_dias"] == horizonte
    assert data["nivel_confianza"] == 0.95
    serie = data["pronostico"]
    assert len(serie) == horizonte

    for dia in serie:
        assert dia["ic_95_inferior"] < dia["pronostico_mxn"] < dia["ic_95_superior"]
        assert dia["pronostico_mxn"] > 0


@pytest.mark.parametrize("modelo", ["campeon", "naive_bayes", "svm", "knn"])
def test_modelos_clasificar_con_los_4_algoritmos(modelo: str):
    """Verifica que POST /clasificar clasifique correctamente pagos altos y pagos bajos en los 4 modelos."""
    req_alto = mod_modelos.SolicitudClasificar(
        unidades=100,
        precio_unitario=7.0,
        frecuencia_proveedor=100,
        dia_semana_num=0,
        es_quincena=True,
        modelo=modelo,
    )
    res_alto = mod_modelos.clasificar_pago(req_alto)
    assert res_alto["alerta_gasto_alto"] == 1
    assert res_alto["probabilidad_alerta"] >= 0.5

    req_bajo = mod_modelos.SolicitudClasificar(
        unidades=2,
        precio_unitario=14.0,
        frecuencia_proveedor=107,
        dia_semana_num=2,
        es_quincena=False,
        modelo=modelo,
    )
    res_bajo = mod_modelos.clasificar_pago(req_bajo)
    assert res_bajo["alerta_gasto_alto"] == 0
    assert res_bajo["probabilidad_alerta"] < 0.5


def test_modelos_metricas_devuelve_aic_y_4_clasificadores():
    """Verifica que GET /metricas exponga la tabla AIC de ARIMA y las matrices de confusión de los 4 modelos."""
    data = mod_modelos.obtener_metricas_modelos()
    assert len(data["arima_sarima"]["candidatos_aic"]) >= 4
    modelos_clf = data["clasificadores"]["comparativa_4_modelos"]
    assert len(modelos_clf) == 4

    for _, met in modelos_clf.items():
        assert "matriz_confusion" in met
        assert 0.0 <= met["precision"] <= 1.0
        assert 0.0 <= met["recall"] <= 1.0
        assert 0.0 <= met["f1_score"] <= 1.0
