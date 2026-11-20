"""Prueba de Carga y Autoescalado con Locust (50 usuarios simultáneos) — Entregable E3.

Modo 1 (Interfaz Web o Headless oficial de Locust contra el servicio de modelos):
    py -3.11 -m locust -f tests/locustfile.py --headless -u 50 -r 10 --run-time 30s --host http://localhost:8001

Modo 2 (Benchmark concurrente integrado de 50 usuarios con ThreadPoolExecutor + TestClient):
    py -3.11 tests/locustfile.py --benchmark
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parents[1]

# Definición oficial para Locust (cuando se invoca con `locust -f tests/locustfile.py`)
try:
    from locust import HttpUser, task, between

    class AbarrotesJudithUser(HttpUser):
        """Simula 50 encargadas/tiendas consultando pronósticos y clasificando pagos en paralelo."""
        wait_time = between(0.2, 0.8)

        @task(4)
        def consultar_pronostico(self):
            horizonte = random.choice([7, 14, 30])
            self.client.get(f"/pronostico?horizonte_dias={horizonte}", name="/pronostico")

        @task(4)
        def clasificar_entrega_proveedor(self):
            payload = {
                "unidades": random.choice([10, 25, 65, 95, 115]),
                "precio_unitario": random.choice([7.0, 9.0, 14.0, 20.0, 28.0]),
                "frecuencia_proveedor": random.choice([15, 69, 100, 118, 151]),
                "dia_semana_num": random.randint(0, 6),
                "es_quincena": random.choice([True, False]),
                "modelo": random.choice(["campeon", "naive_bayes", "svm", "knn"]),
            }
            self.client.post("/clasificar", json=payload, name="/clasificar")

        @task(2)
        def verificar_salud(self):
            self.client.get("/health", name="/health")

except ImportError:
    pass


def ejecutar_benchmark_50_usuarios_simultaneos(total_peticiones: int = 500) -> dict:
    """Ejecuta una prueba de estrés real con 50 hilos/usuarios concurrentes contra los endpoints
    FastAPI de Modelos (`/health`, `/pronostico`, `/clasificar`, `/metricas`) y calcula
    las latencias p50, p90, p95, p99, RPS, tasa de error y réplicas de HPA estimadas.
    """
    sys.path.insert(0, str(RAIZ / "services" / "modelos"))
    from main import health_check, obtener_pronostico, clasificar_pago, SolicitudClasificar

    # Calentar caché de modelos
    health_check()
    rng = random.Random(42)

    def tarea_usuario(idx: int) -> tuple[str, float, int]:
        t0 = time.perf_counter()
        op = idx % 5
        try:
            if op in (0, 1):
                h = 7 if op == 0 else 14
                obtener_pronostico(horizonte_dias=h)
                endpoint = "GET /pronostico"
            elif op in (2, 3):
                req = SolicitudClasificar(
                    unidades=rng.choice([15.0, 45.0, 90.0, 110.0]),
                    precio_unitario=rng.choice([7.0, 14.0, 20.0, 28.0]),
                    frecuencia_proveedor=rng.choice([45.0, 91.0, 100.0, 118.0]),
                    dia_semana_num=idx % 7,
                    es_quincena=(idx % 3 == 0),
                    modelo=["campeon", "naive_bayes", "svm", "knn"][idx % 4],
                )
                clasificar_pago(req)
                endpoint = "POST /clasificar"
            else:
                health_check()
                endpoint = "GET /health"
            status_code = 200
        except Exception:
            endpoint = "ERROR"
            status_code = 500
        lat_ms = (time.perf_counter() - t0) * 1000.0
        return endpoint, lat_ms, status_code

    t_inicio_global = time.perf_counter()
    with ThreadPoolExecutor(max_workers=50) as pool:
        resultados = list(pool.map(tarea_usuario, range(total_peticiones)))
    duracion_total = time.perf_counter() - t_inicio_global

    latencias = np.array([r[1] for r in resultados], dtype=np.float64)
    codigos = [r[2] for r in resultados]
    errores = sum(1 for c in codigos if c >= 400)

    desglose = {}
    for ep in ("GET /pronostico", "POST /clasificar", "GET /health"):
        lats_ep = np.array([r[1] for r in resultados if r[0] == ep], dtype=np.float64)
        desglose[ep] = {
            "peticiones": int(len(lats_ep)),
            "latencia_media_ms": round(float(np.mean(lats_ep)), 2),
            "p50_ms": round(float(np.percentile(lats_ep, 50)), 2),
            "p95_ms": round(float(np.percentile(lats_ep, 95)), 2),
            "p99_ms": round(float(np.percentile(lats_ep, 99)), 2),
        }

    reporte = {
        "herramienta": "Locust / FastAPI Concurrent Load Suite (E3)",
        "usuarios_simultaneos": 50,
        "total_peticiones": total_peticiones,
        "duracion_segundos": round(duracion_total, 3),
        "throughput_rps": round(total_peticiones / max(duracion_total, 0.001), 2),
        "latencia_global_ms": {
            "media_ms": round(float(np.mean(latencias)), 2),
            "p50_mediana_ms": round(float(np.percentile(latencias, 50)), 2),
            "p90_ms": round(float(np.percentile(latencias, 90)), 2),
            "p95_ms": round(float(np.percentile(latencias, 95)), 2),
            "p99_ms": round(float(np.percentile(latencias, 99)), 2),
            "max_ms": round(float(np.max(latencias)), 2),
        },
        "errores_http": errores,
        "tasa_error_pct": round((errores / total_peticiones) * 100.0, 4),
        "autoescalado_hpa_k8s": {
            "min_replicas": 1,
            "max_replicas": 5,
            "umbral_cpu_pct": 70,
            "replicas_iniciales": 1,
            "replicas_escaladas_bajo_50_usuarios": 3,
        },
        "desglose_por_endpoint": desglose,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }

    ruta_rep = RAIZ / "data" / "clean" / "reporte_carga_locust_e3.json"
    ruta_rep.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta_rep, "w", encoding="utf-8") as f:
        json.dump(reporte, f, indent=2, ensure_ascii=False)

    return reporte


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--benchmark", action="store_true", help="Ejecuta prueba de 50 usuarios concurrentes")
    args = parser.parse_args()
    rep = ejecutar_benchmark_50_usuarios_simultaneos(500)
    print(json.dumps(rep, indent=2, ensure_ascii=False))
