# 🛒 AbarrotesIQ — Plataforma Cloud & Analítica Predictiva para Tiendas de Abarrotes

> **Proyecto Integrador DATA STARTUP**  
> **Cómputo en la Nube (IAD-2408) × Analítica de Datos (IAD-2403)** · Ingeniería en Inteligencia Artificial (TecNM)

**AbarrotesIQ** es una plataforma en la nube que conecta un sistema Punto de Venta (POS) con capacidad offline y la digitalización de bitácoras de pago a proveedores para tiendas de abarrotes reales. Limpia los datos automáticamente, visualiza el desempeño por turno/empleada en un dashboard empresarial y pronostica el flujo de efectivo diario y el reabastecimiento de productos perecederos.

* **Negocio Aliado Real:** **Abarrotes "Judith"**
* **Autor (Cloud Lead & Data Lead):** Adolfo Angel Solis Hernández (`@AngelS0lis`)
* **Repositorio Oficial:** [https://github.com/AngelS0lis/data-startup-abarrotesiq](https://github.com/AngelS0lis/data-startup-abarrotesiq)
* **Proveedor Cloud:** Amazon Web Services (AWS) — Presupuesto FinOps `$0.00 MXN`

---

## 📂 Estructura del Repositorio

```text
data-startup-abarrotesiq/
├── README.md                                  # Qué es, cómo se levanta y enlaces a entregables
├── docs/
│   ├── E0-propuesta.md                        # Entregable E0: Lean Canvas, entrevista, cadena de preguntas e inventario
│   ├── E1-dashboard.md                        # Entregable E1: Limpieza, 6 gráficas, FFT, S3 e IAM
│   ├── E2-cimientos.md                        # Entregable E2: API FastAPI, SQS, Worker, PostgreSQL, Series y Regresión OLS
│   ├── E3-produccion.md                       # Entregable E3: Docker, K8s+HPA, Lambda, Terraform, SARIMA, 4 Clasificadores y CI/CD
│   └── img/                                   # Capturas de evidencia (alerta de presupuesto AWS, S3, IAM, SQS, diagramas)
├── data/
│   ├── raw/
│   │   └── gastos_proveedores_libreta1.csv    # Dataset real digitalizado de las Libretas #1 y #2 (1,568 registros)
│   └── sample/
│       └── gastos_proveedores_sample.csv      # Muestra pequeña y anonimizada (100 registros)
├── notebooks/
│   ├── Avance1_EDA_AbarrotesIQ.ipynb          # Notebook completo actualizado (Avance 1 EDA + Avance 2 ML Unidad 3)
│   └── Avance2_ML_AbarrotesIQ.ipynb           # Copia directa del Avance 2 (Preprocesamiento, 80/20 + K-Fold y Modelos ML)
├── services/
│   ├── ingesta/                               # Microservicio API FastAPI + Dockerfile (E2-E3)
│   ├── worker/                                # Limpieza automatizada / AWS Lambda (E2-E3)
│   ├── modelos/                               # Servicio predictivo /pronostico y /clasificar (E3-E4)
│   └── tablero/                               # Dashboard empresarial en Streamlit leyendo de S3 (E1-E5)
├── src/                                       # Aplicación web Punto de Venta (React + TypeScript + IndexedDB)
├── infra/terraform/                           # Infraestructura como código para AWS (E3-E4)
├── k8s/                                       # Manifiestos de Kubernetes (Deployment, Service, HPA)
├── tests/                                     # Pruebas unitarias y scripts de carga (Locust)
└── docker-compose.yml                         # Orquestación local de microservicios
```

---

## 🚀 Entregables del Proyecto

| Entregable | Estado | Documento / Enlace |
| :--- | :---: | :--- |
| **E0 · Propuesta** | ✅ Completado | [`docs/E0-propuesta.md`](docs/E0-propuesta.md) |
| **E1 · Dashboard empresarial** | ✅ Completado | [`docs/E1-dashboard.md`](docs/E1-dashboard.md) · [`services/tablero/app.py`](services/tablero/app.py) |
| **E2 · Cimientos en la nube** | ✅ Completado | [`docs/E2-cimientos.md`](docs/E2-cimientos.md) · [`services/ingesta/main.py`](services/ingesta/main.py) · [`services/worker/worker.py`](services/worker/worker.py) · [`services/modelos/series_y_regresion.py`](services/modelos/series_y_regresion.py) |
| **E3 · Inteligencia en producción** | ✅ Completado | [`docs/E3-produccion.md`](docs/E3-produccion.md) · [`services/modelos/main.py`](services/modelos/main.py) · [`infra/terraform/main.tf`](infra/terraform/main.tf) · [`k8s/`](k8s/) · [`tests/test_api_endpoints.py`](tests/test_api_endpoints.py) |
| **E4 · Blindaje** | 🔜 Próximo | Auditoría y validación walk-forward |
| **E5 · Demo Day** | ⏳ Pendiente | Pitch, costos y demo en vivo |

---

## 💻 Cómo ejecutar en local

### 1. Punto de Venta Web (`src/`)
```bash
npm install
npm run dev
```

### 2. Servicios de Datos y Tablero (E1–E3)
```bash
docker compose up --build
```
