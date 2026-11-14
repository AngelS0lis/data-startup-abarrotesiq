"""Módulo Analítico E2: Series de Tiempo (Descomposición, ADF, ACF, PACF) y
Regresión Lineal por Mínimos Cuadrados implementada a mano con NumPy (Ecuación Normal)
comparada contra scikit-learn.

Cubre: Analítica de Datos Unidad 3 (Temas 3.1 Series de Tiempo y 3.2 Predictores Lineales).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any, Tuple

import numpy as np
import pandas as pd


def regresion_ecuacion_normal_numpy(X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Implementación desde cero con NumPy de la Regresión Lineal por Mínimos Cuadrados
    mediante la Ecuación Normal matricial:
        beta = (X^T X)^(-1) X^T y

    Agrega automáticamente la columna de unos (intercepto beta_0) al inicio de X.
    Retorna:
        beta: vector de parámetros [beta_0, beta_1, ..., beta_p]
        y_hat: predicciones X_b @ beta
    """
    X_mat = np.asarray(X, dtype=np.float64)
    if X_mat.ndim == 1:
        X_mat = X_mat.reshape(-1, 1)
    y_vec = np.asarray(y, dtype=np.float64).reshape(-1)

    n = X_mat.shape[0]
    X_b = np.column_stack([np.ones(n, dtype=np.float64), X_mat])

    # Ecuación normal: (X^T X)^(-1) X^T y
    xtx = X_b.T @ X_b
    xty = X_b.T @ y_vec
    try:
        beta = np.linalg.inv(xtx) @ xty
    except np.linalg.LinAlgError:
        beta = np.linalg.pinv(xtx) @ xty

    y_hat = X_b @ beta
    return beta, y_hat


def calcular_metricas_regresion(y_real: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calcula MSE, RMSE, MAE y coeficiente de determinación R²."""
    y_r = np.asarray(y_real, dtype=np.float64).reshape(-1)
    y_p = np.asarray(y_pred, dtype=np.float64).reshape(-1)
    residuos = y_r - y_p

    mse = float(np.mean(residuos ** 2))
    rmse = float(np.sqrt(mse))
    mae = float(np.mean(np.abs(residuos)))

    ss_res = float(np.sum(residuos ** 2))
    ss_tot = float(np.sum((y_r - np.mean(y_r)) ** 2))
    r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 0 else 0.0

    return {
        "MSE": round(mse, 4),
        "RMSE": round(rmse, 4),
        "MAE": round(mae, 4),
        "R2": round(r2, 4),
    }


def comparar_numpy_vs_sklearn(df_clean: pd.DataFrame) -> Dict[str, Any]:
    """Compara la implementación manual con NumPy (Ecuación Normal) contra
    scikit-learn (LinearRegression) tanto en:
      1) La tendencia lineal sobre la serie diaria agregada.
      2) El modelo predictor multivariado de monto_gasto por entrega.
    """
    try:
        from sklearn.linear_model import LinearRegression
        sklearn_disponible = True
    except ImportError:
        sklearn_disponible = False

    # --- A. Serie diaria agregada (Tendencia + Estacionalidad de Lunes/Quincena + Volumen de pagos) ---
    df_dia = (
        df_clean.groupby("fecha", as_index=False)
        .agg(
            gasto_diario=("monto_gasto", "sum"),
            unidades_diarias=("unidades", "sum"),
            num_pagos=("monto_gasto", "count"),
            dia_semana_num=("dia_semana_num", "first"),
            es_quincena=("es_quincena", "first"),
        )
        .sort_values("fecha")
        .reset_index(drop=True)
    )
    df_dia["t"] = np.arange(len(df_dia), dtype=np.float64)
    df_dia["es_lunes"] = (df_dia["dia_semana_num"] == 0).astype(float)
    df_dia["es_quincena_num"] = df_dia["es_quincena"].astype(float)

    # 1) Regresión de tendencia simple sobre el tiempo (y = beta_0 + beta_1 * t)
    t_vals = df_dia[["t"]].values
    y_dia = df_dia["gasto_diario"].values
    beta_tend_np, y_tend_np = regresion_ecuacion_normal_numpy(t_vals, y_dia)

    # 2) Regresión lineal multivariada diaria (t, num_pagos, unidades_diarias, es_lunes, es_quincena_num)
    features_dia = ["t", "num_pagos", "unidades_diarias", "es_lunes", "es_quincena_num"]
    X_dia = df_dia[features_dia].values
    beta_dia_np, y_hat_dia_np = regresion_ecuacion_normal_numpy(X_dia, y_dia)

    if sklearn_disponible:
        lr_dia = LinearRegression()
        lr_dia.fit(X_dia, y_dia)
        beta_dia_sk = np.concatenate([[lr_dia.intercept_], lr_dia.coef_])
        y_hat_dia_sk = lr_dia.predict(X_dia)
    else:
        X_dia_b = np.column_stack([np.ones(len(X_dia)), X_dia])
        beta_dia_sk = np.linalg.lstsq(X_dia_b, y_dia, rcond=None)[0]
        y_hat_dia_sk = X_dia_b @ beta_dia_sk

    # --- B. Regresión lineal por transacción (unidades, precio_unitario, frecuencia_proveedor, es_quincena) ---
    df_tx = df_clean.copy()
    df_tx["es_quincena_num"] = df_tx["es_quincena"].astype(float)
    df_tx["es_lunes"] = (df_tx["dia_semana_num"] == 0).astype(float)
    features_tx = ["unidades", "precio_unitario", "frecuencia_proveedor", "es_lunes", "es_quincena_num"]
    X_tx = df_tx[features_tx].values.astype(np.float64)
    y_tx = df_tx["monto_gasto"].values.astype(np.float64)

    beta_tx_np, y_hat_tx_np = regresion_ecuacion_normal_numpy(X_tx, y_tx)
    if sklearn_disponible:
        lr_tx = LinearRegression()
        lr_tx.fit(X_tx, y_tx)
        beta_tx_sk = np.concatenate([[lr_tx.intercept_], lr_tx.coef_])
        y_hat_tx_sk = lr_tx.predict(X_tx)
    else:
        X_tx_b = np.column_stack([np.ones(len(X_tx)), X_tx])
        beta_tx_sk = np.linalg.lstsq(X_tx_b, y_tx, rcond=None)[0]
        y_hat_tx_sk = X_tx_b @ beta_tx_sk

    metricas_dia_np = calcular_metricas_regresion(y_dia, y_hat_dia_np)
    metricas_dia_sk = calcular_metricas_regresion(y_dia, y_hat_dia_sk)
    metricas_tx_np = calcular_metricas_regresion(y_tx, y_hat_tx_np)
    metricas_tx_sk = calcular_metricas_regresion(y_tx, y_hat_tx_sk)

    residuos_dia = y_dia - y_hat_dia_np
    residuos_tx = y_tx - y_hat_tx_np

    df_dia["tendencia_lineal_numpy"] = y_tend_np
    df_dia["prediccion_multivariada_numpy"] = y_hat_dia_np
    df_dia["prediccion_multivariada_sklearn"] = y_hat_dia_sk
    df_dia["residuo_diario"] = residuos_dia

    return {
        "df_diario_regresion": df_dia,
        "tendencia_simple": {
            "intercepto_beta0": float(beta_tend_np[0]),
            "pendiente_beta1_por_dia": float(beta_tend_np[1]),
            "metricas": calcular_metricas_regresion(y_dia, y_tend_np),
        },
        "modelo_diario": {
            "variables": ["intercepto"] + features_dia,
            "beta_numpy": [round(float(b), 6) for b in beta_dia_np],
            "beta_sklearn": [round(float(b), 6) for b in beta_dia_sk],
            "diferencia_max_abs": float(np.max(np.abs(beta_dia_np - beta_dia_sk))),
            "metricas_numpy": metricas_dia_np,
            "metricas_sklearn": metricas_dia_sk,
            "residuos_media": float(np.mean(residuos_dia)),
            "residuos_std": float(np.std(residuos_dia, ddof=1)),
        },
        "modelo_transaccional": {
            "variables": ["intercepto"] + features_tx,
            "beta_numpy": [round(float(b), 6) for b in beta_tx_np],
            "beta_sklearn": [round(float(b), 6) for b in beta_tx_sk],
            "diferencia_max_abs": float(np.max(np.abs(beta_tx_np - beta_tx_sk))),
            "metricas_numpy": metricas_tx_np,
            "metricas_sklearn": metricas_tx_sk,
            "residuos_media": float(np.mean(residuos_tx)),
            "residuos_std": float(np.std(residuos_tx, ddof=1)),
        },
    }


def descomponer_serie_tiempo(df_clean: pd.DataFrame, periodo: int = 7) -> pd.DataFrame:
    """Realiza la descomposición clásica aditiva (Y_t = T_t + S_t + R_t) sobre la serie
    diaria regularizada (frecuencia diaria, periodo semanal p = 7 días).
    """
    serie_raw = (
        df_clean.groupby("fecha")["monto_gasto"]
        .sum()
        .sort_index()
    )
    serie_raw.index = pd.to_datetime(serie_raw.index)
    idx_completo = pd.date_range(serie_raw.index.min(), serie_raw.index.max(), freq="D")

    # Para los domingos sin registro en libreta, interpolamos suavemente o usamos mediana móvil
    # para descomponer la dinámica operativa continua
    s_reg = serie_raw.reindex(idx_completo)
    s_interp = s_reg.interpolate(method="linear").bfill().ffill()

    # 1. Tendencia (T_t): media móvil centrada de ventana = periodo (7 días)
    tendencia = s_interp.rolling(window=periodo, center=True, min_periods=1).mean()

    # 2. Serie sin tendencia: Y_t - T_t
    sin_tendencia = s_interp - tendencia

    # 3. Estacionalidad semanal (S_t): promedio por día de la semana centrado en cero
    dias_sem = s_interp.index.dayofweek
    mapa_estacional = sin_tendencia.groupby(dias_sem).transform("mean")
    estacionalidad = mapa_estacional - mapa_estacional.mean()

    # 4. Residuo (R_t): Y_t - T_t - S_t
    residuo = s_interp - tendencia - estacionalidad

    df_desc = pd.DataFrame({
        "fecha": idx_completo,
        "observado": s_interp.values,
        "tendencia": tendencia.values,
        "estacionalidad": estacionalidad.values,
        "residuo": residuo.values,
    })
    return df_desc


def prueba_adf_estacionariedad(serie: pd.Series | np.ndarray) -> Dict[str, Any]:
    """Ejecuta la prueba de raíz unitaria de Dickey-Fuller Aumentada (ADF):
        Delta y_t = alpha + beta*t + gamma*y_{t-1} + sum_{i=1}^p delta_i Delta y_{t-i} + eps_t
    Usa statsmodels si está instalado; de lo contrario, aplica la regresión ADF con NumPy/SciPy.
    """
    y = np.asarray(serie, dtype=np.float64).reshape(-1)
    y = y[~np.isnan(y)]

    try:
        from statsmodels.tsa.stattools import adfuller
        res = adfuller(y, autolag="AIC")
        stat_adf = float(res[0])
        p_val = float(res[1])
        lags_usados = int(res[2])
        n_obs = int(res[3])
        crit_vals = {k: round(float(v), 4) for k, v in res[4].items()}
    except ImportError:
        # Implementación analítica directa de ADF(1) con intercepto mediante Mínimos Cuadrados
        dy = np.diff(y)
        y_lag1 = y[:-1]
        # Incluir 1 rezago de la diferencia (Delta y_{t-1})
        dy_target = dy[1:]
        y_l1 = y_lag1[1:]
        dy_l1 = dy[:-1]
        X_adf = np.column_stack([np.ones(len(dy_target)), y_l1, dy_l1])
        beta_adf = np.linalg.lstsq(X_adf, dy_target, rcond=None)[0]
        res_adf = dy_target - (X_adf @ beta_adf)
        s2 = np.sum(res_adf ** 2) / (len(dy_target) - X_adf.shape[1])
        cov_beta = s2 * np.linalg.inv(X_adf.T @ X_adf)
        se_gamma = np.sqrt(cov_beta[1, 1])
        stat_adf = float(beta_adf[1] / se_gamma)
        lags_usados = 1
        n_obs = int(len(dy_target))
        crit_vals = {"1%": -3.48, "5%": -2.88, "10%": -2.58}
        # Aproximación de p-value de MacKinnon para distribución con constante
        if stat_adf <= -3.48:
            p_val = 0.0005
        elif stat_adf <= -2.88:
            p_val = 0.025
        elif stat_adf <= -2.58:
            p_val = 0.08
        else:
            p_val = 0.35

    es_estacionaria = bool((p_val < 0.05) or (stat_adf < crit_vals.get("5%", -2.88)))
    return {
        "estadistico_adf": round(stat_adf, 4),
        "p_value": round(p_val, 6),
        "rezagos_usados": lags_usados,
        "observaciones": n_obs,
        "valores_criticos": crit_vals,
        "es_estacionaria_al_5pct": es_estacionaria,
        "conclusion": (
            "Se rechaza H0 (raíz unitaria) al 5% de significancia: la serie diaria es ESTACIONARIA."
            if es_estacionaria
            else "No se rechaza H0: la serie requiere diferenciación (d=1) para alcanzar estacionariedad."
        ),
    }


def calcular_acf_pacf(serie: pd.Series | np.ndarray, nlags: int = 21) -> pd.DataFrame:
    """Calcula la Función de Autocorrelación (ACF) y la Función de Autocorrelación Parcial (PACF)
    mediante las ecuaciones de Yule-Walker (o statsmodels) junto con el intervalo de confianza al 95%.
    """
    x = np.asarray(serie, dtype=np.float64).reshape(-1)
    x = x[~np.isnan(x)]
    n = len(x)
    x_cent = x - np.mean(x)
    var_x = np.sum(x_cent ** 2)

    acf_vals = np.zeros(nlags + 1, dtype=np.float64)
    acf_vals[0] = 1.0
    for k in range(1, nlags + 1):
        if var_x > 0:
            acf_vals[k] = np.sum(x_cent[:-k] * x_cent[k:]) / var_x

    # PACF mediante recursión de Durbin-Levinson / Yule-Walker
    pacf_vals = np.zeros(nlags + 1, dtype=np.float64)
    pacf_vals[0] = 1.0
    for k in range(1, nlags + 1):
        # Construir matriz Toeplitz R_k de tamaño k x k
        idx = np.abs(np.subtract.outer(np.arange(k), np.arange(k)))
        R_k = acf_vals[idx]
        r_vec = acf_vals[1 : k + 1]
        try:
            phi_k = np.linalg.solve(R_k, r_vec)
        except np.linalg.LinAlgError:
            phi_k = np.linalg.lstsq(R_k, r_vec, rcond=None)[0]
        pacf_vals[k] = phi_k[-1]

    ic_95 = 1.96 / np.sqrt(n)
    return pd.DataFrame({
        "rezago_k": np.arange(nlags + 1),
        "ACF": np.round(acf_vals, 4),
        "PACF": np.round(pacf_vals, 4),
        "limite_ic_sup": np.round(ic_95, 4),
        "limite_ic_inf": np.round(-ic_95, 4),
    })


if __name__ == "__main__":
    raiz = Path(__file__).resolve().parents[2]
    path_clean = raiz / "data" / "clean" / "gastos_abarrotes_clean.csv"
    df_c = pd.read_csv(path_clean)

    res_reg = comparar_numpy_vs_sklearn(df_c)
    df_desc = descomponer_serie_tiempo(df_c, periodo=7)
    res_adf = prueba_adf_estacionariedad(df_desc["observado"])
    df_acf = calcular_acf_pacf(df_desc["observado"], nlags=21)

    resumen_e2 = {
        "tendencia_simple": res_reg["tendencia_simple"],
        "modelo_diario": res_reg["modelo_diario"],
        "modelo_transaccional": res_reg["modelo_transaccional"],
        "prueba_adf": res_adf,
        "acf_pacf_destacados": df_acf[df_acf["rezago_k"].isin([1, 2, 7, 14, 21])].to_dict(orient="records"),
    }
    print(json.dumps(resumen_e2, indent=2, ensure_ascii=False))
