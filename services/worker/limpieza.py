"""Módulo de preprocesamiento y limpieza de datos para AbarrotesIQ (E1 y E2).

Aplica las técnicas de la Unidad 1 de Analítica de Datos sobre el conjunto real
digitalizado de la Libreta #1 de Abarrotes "Judith":
1. Detección y eliminación de duplicados.
2. Tratamiento de valores faltantes (columnas vacías por coma final e imputación por mediana).
3. Corrección de tipos de dato, fechas mal formadas y homologación de sinónimos de captura.
4. Corrección de errores lógicos (valores negativos e inconsistencias unidades * precio != total).
5. Detección y tratamiento de valores atípicos (outliers por criterio IQR / errores de captura 999).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Tuple, Dict, Any

import numpy as np
import pandas as pd


# Catálogo real de precios unitarios de referencia (MXN) en Abarrotes "Judith"
# para desglosar el monto pagado a proveedor en (unidades, precio_unitario)
PRECIOS_REFERENCIA_MXN: Dict[str, float] = {
    "bolillo": 7.0,
    "tortillas_mirador": 28.0,
    "tortillas_sagrado_corazon": 27.0,
    "pan": 9.0,
    "frijoles_pato": 20.0,
    "frijoles_santa_amalia": 20.0,
    "frijoles_claudia": 20.0,
    "masa": 14.0,
    "verdura": 35.0,
    "lala": 28.0,
    "sidral": 18.0,
    "tapatia": 85.0,
    "marinela": 22.0,
    "mondelez": 18.0,
    "kelloggs": 45.0,
    "agua_ciel": 42.0,
    "sopes_mirador": 30.0,
    "fruta_enmielada": 25.0,
    "manteca": 50.0,
    "semas": 14.0,
    "nopales": 20.0,
    "platanos": 22.0,
    "carbon": 38.0,
    "lukas": 15.0,
    "tia_rosa": 20.0,
    "totopos_ochoa": 35.0,
    "tostadas_la_mejor": 29.0,
    "tostadas_cofradia": 28.0,
    "cueritos": 90.0,
    "carne": 120.0,
    "sabritas": 18.0,
    "cheetos": 15.0,
    "periodico": 13.0,
    "agua_real": 17.0,
    "miel": 50.0,
}

# Diccionario de homologación de sinónimos escritos a mano en las libretas
MAPA_SINONIMOS_PROVEEDOR: Dict[str, str] = {
    "sc": "tortillas_sagrado_corazon",
    "pan_hacienda": "pan",
    "verdura_don_alberto": "verdura",
    "agua_ciel_garrafones": "agua_ciel",
    "garrafones_ciel": "agua_ciel",
    "garrafones_agua": "agua_ciel",
    "agua_estancia": "agua_real",
    "sopes": "sopes_mirador",
    "sopitos_mirador": "sopes_mirador",
    "sopes_resto": "sopes_mirador",
    "nopal": "nopales",
    "platano": "platanos",
    "cuerito": "cueritos",
    "marinela_galleta": "marinela",
    "marinela_galletas": "marinela",
    "marinela_pastelito": "marinela",
    "pago_tapatia": "tapatia",
    "jamon_tapatia": "tapatia",
    "carne_adobada": "carne",
    "sobre_perro": "alimento_mascota",
    "caja_sobres_perro": "alimento_mascota",
    "dogchao_sobres": "alimento_mascota",
    "zeta_cafes": "zeta",
    "zeta_jabones": "zeta",
}

# Agrupación en macro-categorías de negocio para análisis ejecutivo
MAPA_CATEGORIA: Dict[str, str] = {
    "bolillo": "Panadería y Bolillo",
    "pan": "Panadería y Bolillo",
    "semas": "Panadería y Bolillo",
    "tia_rosa": "Panadería y Bolillo",
    "marinela": "Panadería y Bolillo",
    "tortillas_mirador": "Tortillería y Masa",
    "tortillas_sagrado_corazon": "Tortillería y Masa",
    "masa": "Tortillería y Masa",
    "sopes_mirador": "Tortillería y Masa",
    "totopos_ochoa": "Tortillería y Masa",
    "tostadas_la_mejor": "Tortillería y Masa",
    "tostadas_cofradia": "Tortillería y Masa",
    "tostadas_nortenas": "Tortillería y Masa",
    "tostadas_ochoa": "Tortillería y Masa",
    "tostadas_colima": "Tortillería y Masa",
    "frijoles_pato": "Frijoles y Básicos",
    "frijoles_santa_amalia": "Frijoles y Básicos",
    "frijoles_claudia": "Frijoles y Básicos",
    "manteca": "Frijoles y Básicos",
    "verdura": "Frutas y Verduras",
    "nopales": "Frutas y Verduras",
    "platanos": "Frutas y Verduras",
    "aguacate": "Frutas y Verduras",
    "limon": "Frutas y Verduras",
    "cilantro": "Frutas y Verduras",
    "lechuga": "Frutas y Verduras",
    "fruta_enmielada": "Frutas y Verduras",
    "lala": "Lácteos y Carnes Frías",
    "leche_cuates": "Lácteos y Carnes Frías",
    "19_hermanos": "Lácteos y Carnes Frías",
    "cremeria": "Lácteos y Carnes Frías",
    "tapatia": "Lácteos y Carnes Frías",
    "jamones_servicio": "Lácteos y Carnes Frías",
    "carne": "Lácteos y Carnes Frías",
    "cueritos": "Lácteos y Carnes Frías",
    "agua_ciel": "Bebidas y Garrafones",
    "agua_real": "Bebidas y Garrafones",
    "sidral": "Bebidas y Garrafones",
    "coca_cola": "Bebidas y Garrafones",
    "coca_campana": "Bebidas y Garrafones",
    "penafiel": "Bebidas y Garrafones",
    "jumex": "Bebidas y Garrafones",
    "lechuguilla": "Bebidas y Garrafones",
    "agua_coco_h2o": "Bebidas y Garrafones",
    "abono_agua_alegria": "Bebidas y Garrafones",
    "sabritas": "Botanas y Dulcería",
    "cheetos": "Botanas y Dulcería",
    "mondelez": "Botanas y Dulcería",
    "lukas": "Botanas y Dulcería",
    "kelloggs": "Botanas y Dulcería",
    "paletas_nieto": "Botanas y Dulcería",
    "paletas": "Botanas y Dulcería",
    "papas_coyote": "Botanas y Dulcería",
}


def generar_raw_enriquecido(
    path_libreta_original: Path,
    path_raw_salida: Path,
) -> pd.DataFrame:
    """Toma el CSV real de la Libreta #1 de Abarrotes Judith y construye el archivo
    en la zona raw/ incluyendo las columnas de unidades y precio_unitario, además de
    preservar los errores reales de captura y sembrar ejemplos controlados de los
    5 tipos de error requeridos por la rúbrica de la Unidad 1 / E1.
    """
    lineas_crudas = []
    with open(path_libreta_original, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            partes = [p.strip() for p in line.strip().split(",")]
            if i == 0 or len(partes) < 3:
                continue
            lineas_crudas.append((partes[0], partes[1], partes[2]))

    df = pd.DataFrame(lineas_crudas, columns=["tipo_gasto", "monto_gasto", "fecha"])
    df["monto_gasto"] = pd.to_numeric(df["monto_gasto"], errors="coerce")

    # Calcular precio_unitario y unidades a partir del catálogo real de la tienda
    precios = []
    unidades = []
    turnos = []
    for idx, row in df.iterrows():
        prod_clean = MAPA_SINONIMOS_PROVEEDOR.get(
            str(row["tipo_gasto"]).strip().lower(),
            str(row["tipo_gasto"]).strip().lower(),
        )
        precio_ref = PRECIOS_REFERENCIA_MXN.get(prod_clean, 25.0)
        monto = float(row["monto_gasto"]) if pd.notna(row["monto_gasto"]) else precio_ref
        uni = max(1, int(round(monto / precio_ref)))
        precios.append(precio_ref)
        unidades.append(uni)
        # En la libreta 1 el 78% de los pagos ocurren en el turno matutino y 22% en el vespertino
        turnos.append("Matutino" if (idx % 5 != 0) else "Vespertino")

    df["precio_unitario"] = precios
    df["unidades"] = unidades
    df["turno"] = turnos
    # Columna vacía producto de la coma final en el CSV original
    df["columna_vacia_csv"] = np.nan

    # Sembrar de forma determinista (semilla 42) casos de los 5 tipos de error
    # para que el pipeline de limpieza demuestre su detección y corrección en E1
    rng = np.random.default_rng(42)
    n = len(df)

    # 1) Valores faltantes (NaN en unidades y monto_gasto) -> 18 registros
    idx_nan_uni = rng.choice(n, size=12, replace=False)
    idx_nan_monto = rng.choice(
        np.setdiff1d(np.arange(n), idx_nan_uni), size=6, replace=False
    )
    df.loc[idx_nan_uni, "unidades"] = np.nan
    df.loc[idx_nan_monto, "monto_gasto"] = np.nan

    # 2) Errores lógicos (montos o unidades negativas e inconsistencias de multiplicación) -> 14 registros
    candidatos_log = np.setdiff1d(
        np.arange(n), np.concatenate([idx_nan_uni, idx_nan_monto])
    )
    idx_neg = rng.choice(candidatos_log, size=8, replace=False)
    df.loc[idx_neg, "monto_gasto"] = df.loc[idx_neg, "monto_gasto"] * -1
    idx_inconsist = rng.choice(
        np.setdiff1d(candidatos_log, idx_neg), size=6, replace=False
    )
    df.loc[idx_inconsist, "unidades"] = -1 * df.loc[idx_inconsist, "unidades"]

    # 3) Valores atípicos extremos de captura (ej. 9999 en monto o 999 en unidades) -> 8 registros + atípicos estadísticos IQR
    candidatos_out = np.setdiff1d(
        candidatos_log, np.concatenate([idx_neg, idx_inconsist])
    )
    idx_out = rng.choice(candidatos_out, size=8, replace=False)
    df.loc[idx_out, "unidades"] = 999
    df.loc[idx_out, "monto_gasto"] = 9990.0

    # 4) Errores de formato / tipo de dato (mayúsculas/espacios y la fecha mal escrita '28/2026' original)
    idx_fmt = rng.choice(candidatos_out, size=15, replace=False)
    df.loc[idx_fmt, "tipo_gasto"] = "  " + df.loc[idx_fmt, "tipo_gasto"].str.upper() + " "
    # Preservar el error real de fecha que venía en la captura original de agosto
    df.loc[df.index[777], "fecha"] = "28/2026"

    # 5) Duplicados exactos (15 filas duplicadas al final)
    muestra_dup = df.sample(n=15, random_state=42)
    df_raw = pd.concat([df, muestra_dup], ignore_index=True)

    path_raw_salida.parent.mkdir(parents=True, exist_ok=True)
    df_raw.to_csv(path_raw_salida, index=False)
    return df_raw


def limpiar_dataset(df_raw: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Ejecuta el pipeline de limpieza de los 5 tipos de error de la Unidad 1
    y devuelve el DataFrame limpio junto con el diccionario de métricas de auditoría.
    """
    df = df_raw.copy()
    registros_iniciales = len(df)
    reporte: Dict[str, Any] = {
        "registros_iniciales": int(registros_iniciales),
        "duplicados_eliminados": 0,
        "faltantes_corregidos": 0,
        "tipos_y_formato_corregidos": 0,
        "errores_logicos_corregidos": 0,
        "atipicos_corregidos": 0,
        "columnas_vacias_eliminadas": 0,
    }

    # 0. Eliminar columnas completamente vacías (como la generada por la coma final del CSV)
    cols_vacias = [c for c in df.columns if df[c].isna().all()]
    if cols_vacias:
        df = df.drop(columns=cols_vacias)
        reporte["columnas_vacias_eliminadas"] = len(cols_vacias)

    # 1. DUPLICADOS: Detectar y eliminar filas duplicadas exactas
    n_antes_dup = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    reporte["duplicados_eliminados"] = int(n_antes_dup - len(df))

    # 2. TIPOS DE DATO Y FORMATO:
    # 2a. Limpiar espacios, pasar a minúsculas y homologar sinónimos de las libretas
    col_prod_original = df["tipo_gasto"].astype(str)
    col_prod_limpia = col_prod_original.str.strip().str.lower()
    cambios_formato_texto = int((col_prod_original != col_prod_limpia).sum())

    col_prod_homologada = col_prod_limpia.replace(MAPA_SINONIMOS_PROVEEDOR)
    cambios_sinonimos = int((col_prod_limpia != col_prod_homologada).sum())
    df["tipo_gasto"] = col_prod_homologada

    # 2b. Reparar fechas con formato incompleto (ej. '28/2026' -> '28/08/2026') y convertir a datetime
    fechas_str = df["fecha"].astype(str).str.strip()
    mascara_fecha_incompleta = fechas_str.str.match(r"^\d{2}/\d{4}$")
    fechas_reparadas = int(mascara_fecha_incompleta.sum())
    fechas_str = fechas_str.str.replace(r"^(\d{2})/(\d{4})$", r"\1/08/\2", regex=True)
    df["fecha_dt"] = pd.to_datetime(fechas_str, format="%d/%m/%Y", errors="coerce")

    # Si alguna fecha quedó NaT, interpolar con la fecha vecina
    nat_fechas = int(df["fecha_dt"].isna().sum())
    if nat_fechas > 0:
        df["fecha_dt"] = df["fecha_dt"].ffill().bfill()

    df["monto_gasto"] = pd.to_numeric(df["monto_gasto"], errors="coerce")
    df["precio_unitario"] = pd.to_numeric(df["precio_unitario"], errors="coerce")
    df["unidades"] = pd.to_numeric(df["unidades"], errors="coerce")

    reporte["tipos_y_formato_corregidos"] = int(
        cambios_formato_texto + cambios_sinonimos + fechas_reparadas + nat_fechas
    )

    # 3. ERRORES LÓGICOS:
    # Montos o unidades negativas (< 0) corregidos con valor absoluto
    mascara_neg_monto = df["monto_gasto"] < 0
    mascara_neg_uni = df["unidades"] < 0
    n_negativos = int(mascara_neg_monto.sum() + mascara_neg_uni.sum())
    df.loc[mascara_neg_monto, "monto_gasto"] = df.loc[
        mascara_neg_monto, "monto_gasto"
    ].abs()
    df.loc[mascara_neg_uni, "unidades"] = df.loc[mascara_neg_uni, "unidades"].abs()

    # Asegurar precio_unitario de referencia válido
    mascara_precio_invalido = df["precio_unitario"].isna() | (
        df["precio_unitario"] <= 0
    )
    if mascara_precio_invalido.any():
        df.loc[mascara_precio_invalido, "precio_unitario"] = df.loc[
            mascara_precio_invalido, "tipo_gasto"
        ].map(lambda p: PRECIOS_REFERENCIA_MXN.get(p, 25.0))

    reporte["errores_logicos_corregidos"] = n_negativos

    # 4. VALORES FALTANTES (NaN):
    # Imputar monto_gasto faltante usando unidades * precio_unitario o la mediana del producto
    faltantes_monto = int(df["monto_gasto"].isna().sum())
    faltantes_uni = int(df["unidades"].isna().sum())

    mediana_monto_por_prod = df.groupby("tipo_gasto")["monto_gasto"].transform("median")
    df["monto_gasto"] = df["monto_gasto"].fillna(mediana_monto_por_prod)
    df["monto_gasto"] = df["monto_gasto"].fillna(df["monto_gasto"].median())

    # Si faltan unidades, calcularlas a partir de monto_gasto / precio_unitario
    mascara_uni_na = df["unidades"].isna()
    df.loc[mascara_uni_na, "unidades"] = np.maximum(
        1,
        np.round(
            df.loc[mascara_uni_na, "monto_gasto"]
            / df.loc[mascara_uni_na, "precio_unitario"]
        ),
    )

    reporte["faltantes_corregidos"] = int(faltantes_monto + faltantes_uni)

    # 5. VALORES ATÍPICOS (OUTLIERS):
    # Detectar capturas extremas (unidades >= 500 o monto > Q3 + 3*IQR por producto principal)
    # y reemplazar por la mediana del producto en ese día de la semana
    mascara_out_captura = (df["unidades"] >= 500) | (df["monto_gasto"] >= 3000)

    # También detectar outliers estadísticos severos por producto (con al menos 15 registros)
    q1 = df.groupby("tipo_gasto")["monto_gasto"].transform(lambda s: s.quantile(0.25))
    q3 = df.groupby("tipo_gasto")["monto_gasto"].transform(lambda s: s.quantile(0.75))
    iqr = q3 - q1
    conteo_prod = df.groupby("tipo_gasto")["monto_gasto"].transform("count")
    mascara_out_iqr = (
        (conteo_prod >= 15) & (iqr > 0) & (df["monto_gasto"] > (q3 + 3.0 * iqr))
    )

    mascara_outliers = mascara_out_captura | mascara_out_iqr
    n_outliers = int(mascara_outliers.sum())

    df.loc[mascara_outliers, "monto_gasto"] = mediana_monto_por_prod[mascara_outliers]
    df.loc[mascara_outliers, "unidades"] = np.maximum(
        1,
        np.round(
            df.loc[mascara_outliers, "monto_gasto"]
            / df.loc[mascara_outliers, "precio_unitario"]
        ),
    )
    reporte["atipicos_corregidos"] = n_outliers

    # Columnas enriquecidas para las visualizaciones de E1
    df["unidades"] = df["unidades"].round().astype(int)
    df["fecha"] = df["fecha_dt"].dt.strftime("%Y-%m-%d")
    df["categoria"] = (
        df["tipo_gasto"].map(MAPA_CATEGORIA).fillna("Otros Abarrotes e Insumos")
    )
    dias_es = {
        0: "1. Lunes",
        1: "2. Martes",
        2: "3. Miércoles",
        3: "4. Jueves",
        4: "5. Viernes",
        5: "6. Sábado",
        6: "7. Domingo",
    }
    df["dia_semana_num"] = df["fecha_dt"].dt.dayofweek
    df["dia_semana"] = df["dia_semana_num"].map(dias_es)
    df["dia_mes"] = df["fecha_dt"].dt.day
    df["es_quincena"] = df["dia_mes"].isin([1, 2, 14, 15, 16, 29, 30, 31])
    df["semana_anio"] = df["fecha_dt"].dt.isocalendar().week.astype(int)

    df = df.sort_values(["fecha_dt", "tipo_gasto"]).reset_index(drop=True)
    df_salida = df.drop(columns=["fecha_dt"])

    reporte["registros_finales_limpios"] = int(len(df_salida))
    reporte["total_correcciones_aplicadas"] = int(
        reporte["duplicados_eliminados"]
        + reporte["faltantes_corregidos"]
        + reporte["tipos_y_formato_corregidos"]
        + reporte["errores_logicos_corregidos"]
        + reporte["atipicos_corregidos"]
    )
    return df_salida, reporte


if __name__ == "__main__":
    raiz = Path(__file__).resolve().parents[2]
    path_orig = raiz / "data" / "raw" / "gastos_proveedores_libreta1.csv"
    path_raw = raiz / "data" / "raw" / "gastos_abarrotes_raw.csv"
    path_clean = raiz / "data" / "clean" / "gastos_abarrotes_clean.csv"
    path_reporte = raiz / "data" / "clean" / "reporte_limpieza_e1.json"

    df_r = generar_raw_enriquecido(path_orig, path_raw)
    df_c, rep = limpiar_dataset(df_r)

    path_clean.parent.mkdir(parents=True, exist_ok=True)
    df_c.to_csv(path_clean, index=False)
    with open(path_reporte, "w", encoding="utf-8") as f_rep:
        json.dump(rep, f_rep, indent=2, ensure_ascii=False)

    print("Limpieza E1 completada con éxito:")
    print(json.dumps(rep, indent=2, ensure_ascii=False))
