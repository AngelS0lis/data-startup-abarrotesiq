"""Microservicio de Modelos Predictivos (FastAPI) para AbarrotesIQ — Entregable E3.

Expone en producción:
- GET  /health       : Estado del servicio y versión de los modelos cargados desde `models/`.
- GET  /pronostico   : Pronóstico ARIMA/SARIMA de 7 a 30 días con banda de confianza al 95%.
- POST /pronostico   : Pronóstico parametrizado por horizonte (7 a 30 días).
- POST /clasificar   : Clasifica un pago/jornada en `alerta_gasto_alto` (0 o 1) usando
                       el modelo campeón o cualquiera de los 4 clasificadores (Naive Bayes, SVM, KNN, Árbol).
- GET  /metricas     : Comparativa completa de AIC/BIC de ARIMA/SARIMA y Matrices de Confusión,
                       Precisión, Recall y F1-Score de los 4 clasificadores.
"""

from __future__ import annotations

import pickle
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query, status
from pydantic import BaseModel, Field

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from entrenar_modelos import (
    construir_y_guardar_modelos,
    pronosticar_horizonte_sarima,
    clasificar_transaccion_en_vivo,
)

app = FastAPI(
    title="AbarrotesIQ · API de Modelos Predictivos ARIMA y Clasificador (E3)",
    description=(
        "Servicio en contenedor para pronóstico de flujo de efectivo a 7–30 días con banda de confianza al 95% "
        "(`/pronostico`) y clasificación preventiva de riesgo de liquidez (`/clasificar`) para **Abarrotes 'Judith'**."
    ),
    version="3.0.0",
)

_CACHE_MODELOS: dict = {}


def obtener_modelos_cargados() -> dict:
    """Carga los artefactos versionados desde `models/` o los entrena automáticamente si no existen."""
    if _CACHE_MODELOS:
        return _CACHE_MODELOS

    dir_models = RAIZ / "models"
    path_arima = dir_models / "arima_gasto_v1.pkl"
    path_clf = dir_models / "clasificador_liquidez_v1.pkl"

    if path_arima.exists() and path_clf.exists():
        with open(path_arima, "rb") as fa:
            artefacto_arima = pickle.load(fa)
        with open(path_clf, "rb") as fc:
            artefacto_clf = pickle.load(fc)
    else:
        res = construir_y_guardar_modelos()
        artefacto_arima = res["artefacto_arima"]
        artefacto_clf = res["artefacto_clf"]

    _CACHE_MODELOS["arima"] = artefacto_arima
    _CACHE_MODELOS["clf"] = artefacto_clf
    return _CACHE_MODELOS


class SolicitudPronostico(BaseModel):
    horizonte_dias: int = Field(default=14, ge=7, le=30, examples=[14])


class SolicitudClasificar(BaseModel):
    unidades: float = Field(..., gt=0, le=2000, examples=[95.0])
    precio_unitario: float = Field(..., gt=0, le=5000, examples=[7.0])
    frecuencia_proveedor: float = Field(default=100.0, ge=1, le=500, examples=[100.0])
    dia_semana_num: int = Field(default=0, ge=0, le=6, examples=[0])
    es_quincena: bool = Field(default=False, examples=[True])
    modelo: Optional[str] = Field(
        default="campeon",
        description="Opciones: 'campeon', 'arbol', 'naive_bayes', 'svm', 'knn'",
        examples=["campeon"],
    )


@app.get("/health", tags=["Monitoreo"])
def health_check():
    """Healthcheck para Kubernetes (liveness/readiness probe) y AWS App Runner / ECS."""
    mods = obtener_modelos_cargados()
    sel = mods["arima"]["modelo_seleccionado"]
    return {
        "servicio": "abarrotesiq-modelos-api",
        "estado": "OK",
        "version": "3.0.0",
        "modelo_pronostico_activo": sel["nombre_modelo"],
        "aic_modelo": sel["AIC"],
        "clasificador_campeon": mods["clf"]["modelo_campeon"],
    }


@app.get("/pronostico", tags=["Pronóstico Series de Tiempo"])
def obtener_pronostico(
    horizonte_dias: int = Query(default=14, ge=7, le=30, description="Horizonte de pronóstico entre 7 y 30 días"),
):
    """Calcula el pronóstico de desembolso diario en caja (7 a 30 días) con intervalo de confianza al 95%."""
    mods = obtener_modelos_cargados()
    art_arima = mods["arima"]
    serie_pronostico = pronosticar_horizonte_sarima(art_arima, horizonte_dias=horizonte_dias)
    sel = art_arima["modelo_seleccionado"]

    return {
        "modelo": sel["nombre_modelo"],
        "horizonte_dias": horizonte_dias,
        "nivel_confianza": 0.95,
        "metricas_entrenamiento": {
            "AIC": sel["AIC"],
            "BIC": sel["BIC"],
            "RMSE": sel["RMSE"],
            "MAE": sel["MAE"],
            "MAPE_pct": sel["MAPE_pct"],
        },
        "justificacion_parametros": art_arima["justificacion_parametros"],
        "pronostico": serie_pronostico,
    }


@app.post("/pronostico", status_code=status.HTTP_200_OK, tags=["Pronóstico Series de Tiempo"])
def post_pronostico(req: SolicitudPronostico):
    """Endpoint POST `/pronostico` compatible con clientes REST y pruebas de carga."""
    return obtener_pronostico(horizonte_dias=req.horizonte_dias)


@app.post("/clasificar", status_code=status.HTTP_200_OK, tags=["Clasificación de Liquidez"])
def clasificar_pago(req: SolicitudClasificar):
    """Clasifica si una entrega de proveedor o jornada requerirá alerta de liquidez (> Q3 = $300 MXN)."""
    mods = obtener_modelos_cargados()
    resultado = clasificar_transaccion_en_vivo(
        artefacto_clf=mods["clf"],
        unidades=req.unidades,
        precio_unitario=req.precio_unitario,
        frecuencia_proveedor=req.frecuencia_proveedor,
        dia_semana_num=req.dia_semana_num,
        es_quincena=req.es_quincena,
        modelo_elegido=req.modelo or "campeon",
    )
    return resultado


@app.get("/metricas", tags=["Evaluación y Comparativa de Modelos"])
def obtener_metricas_modelos():
    """Devuelve la comparativa de los candidatos ARIMA/SARIMA (AIC/BIC) y los 4 clasificadores
    (Naive Bayes, SVM, KNN y Árbol de Decisión) con sus matrices de confusión, precisión, recall y F1.
    """
    mods = obtener_modelos_cargados()
    return {
        "arima_sarima": {
            "modelo_seleccionado": mods["arima"]["modelo_seleccionado"]["nombre_modelo"],
            "candidatos_aic": mods["arima"]["comparativa_candidatos_aic"],
            "justificacion": mods["arima"]["justificacion_parametros"],
        },
        "clasificadores": {
            "modelo_campeon": mods["clf"]["modelo_campeon"],
            "umbral_q3_mxn": mods["clf"]["umbral_q3_mxn"],
            "n_train": mods["clf"]["n_train"],
            "n_test": mods["clf"]["n_test"],
            "comparativa_4_modelos": mods["clf"]["comparativa_4_modelos"],
            "justificacion_recall_vs_precision": mods["clf"]["justificacion_recall_vs_precision"],
        },
    }
