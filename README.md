# 🛒 AbarrotesIQ — Plataforma Cloud & Analítica Predictiva para Tiendas de Abarrotes

> **Proyecto Integrador DATA STARTUP**  
> **Cómputo en la Nube (IAD-2408) × Analítica de Datos (IAD-2403)** · Ingeniería en Inteligencia Artificial (TecNM)

**AbarrotesIQ** es una plataforma en la nube que conecta un sistema Punto de Venta (POS) con capacidad offline y la digitalización de bitácoras de pago a proveedores para tiendas de abarrotes reales. Limpia los datos automáticamente, visualiza el desempeño por turno/empleada en un dashboard empresarial y pronostica el flujo de efectivo diario y el reabastecimiento de productos perecederos.

* **Negocio Aliado Real:** **Abarrotes "Judith"**
* **Autor (Cloud Lead & Data Lead):** Adolfo Angel Solis Hernández (`@AngelS0lis`)
* **Proveedor Cloud:** Amazon Web Services (AWS) — Presupuesto FinOps `$0.00 MXN`

---

## 📂 Estructura del Repositorio

```text
pointsale/ (AbarrotesIQ)
├── README.md                                  # Qué es, cómo se levanta y enlaces a entregables
├── docs/
│   ├── E0-propuesta.md                        # Entregable E0: Lean Canvas, entrevista, cadena de preguntas e inventario
│   └── img/                                   # Capturas de evidencia (alerta de presupuesto AWS, diagramas)
├── data/
│   ├── raw/
│   │   └── gastos_proveedores_libreta1.csv    # Dataset real digitalizado de la Libreta #1 (1,151 registros)
│   └── sample/
│       └── gastos_proveedores_sample.csv      # Muestra pequeña y anonimizada (100 registros)
├── notebooks/                                 # Exploración, preprocesamiento y entrenamiento de modelos
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
| **E1 · Dashboard empresarial** | 🔜 Próximo | `services/tablero/` |
| **E2 · Cimientos en la nube** | ⏳ Pendiente | `services/ingesta/`, `services/worker/` |
| **E3 · Inteligencia en producción** | ⏳ Pendiente | `services/modelos/`, `infra/terraform/`, `k8s/` |
| **E4 · Blindaje** | ⏳ Pendiente | Auditoría y validación walk-forward |
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
