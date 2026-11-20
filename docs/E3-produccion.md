# E3 · Inteligencia en Producción: El Modelo Vive en la Nube
> **AbarrotesIQ — Contenedores Multi-Stage, Kubernetes + HPA, Serverless Lambda, Terraform IaC, Pronóstico SARIMA (7–30 días), 4 Clasificadores y Suite CI/CD**

**Proyecto Integrador DATA STARTUP**  
**Materias:** Cómputo en la Nube (Unidad 3, temas 3.1 a 3.6) × Analítica de Datos (Unidad 3, temas 3.1 y 3.5)  
**Autor (Cloud Lead & Data Lead):** Adolfo Angel Solis Hernández (`@AngelS0lis`)  
**Cliente Aliado Real:** **Abarrotes "Judith"**  
**Etiqueta de entrega:** `e3`

---

## 1. Contenedores, Despliegue Administrado y Orquestación con Kubernetes (Nube · 50 pts)

### 1.1 Contenedores Multi-Stage sin Secretos y `docker-compose.yml` (15 pts)
Cada microservicio cuenta con su propio `Dockerfile` **multi-stage** (`builder` $\rightarrow$ `runtime`) ejecutado bajo un usuario sin privilegios (`appuser`, UID `10001`), con `HEALTHCHECK` integrado y cero credenciales en el código:
* [`services/ingesta/Dockerfile`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/ingesta/Dockerfile) (API FastAPI de recepción de gastos y CSV en puerto `8000`).
* [`services/worker/Dockerfile`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/worker/Dockerfile) (Consumidor de cola SQS y limpieza hacia S3 y PostgreSQL).
* [`services/modelos/Dockerfile`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/modelos/Dockerfile) (API FastAPI de inferencia `/pronostico`, `/clasificar` y `/metricas` en puerto `8001`).
* [`services/tablero/Dockerfile`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/tablero/Dockerfile) (Tablero Empresarial v3 en Streamlit en puerto `8501`).
* [`docker-compose.yml`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/docker-compose.yml): Levanta los 4 microservicios y la base de datos `postgres:16-alpine` con un solo comando (`docker compose up --build`).

#### Fundamentación Teórica (Unidad 3): Imagen vs. Contenedor, Capas de Docker y Tiempo de Arranque
* **Imagen vs. Contenedor:** Una **imagen** es una plantilla inmutable de solo lectura compuesta por capas superpuestas (*UnionFS*) que empaqueta el binario de Python, las librerías compiladas y el código de la aplicación. Un **contenedor** es una instancia en ejecución de esa imagen con una capa superior escribible efímera y aislamiento mediante *namespaces* y *cgroups* del kernel.
* **Por qué un contenedor arranca en segundos y una máquina virtual (VM) en minutos:** Una VM (`Amazon EC2`) virtualiza el hardware completo mediante un hipervisor (*Nitro/KVM*) y debe inicializar su propio sistema operativo invitado completo (BIOS/UEFI, kernel completo, `systemd`, demonios de red y montaje de discos), lo que toma de **45 a 120 segundos**. En cambio, un contenedor **comparte directamente el kernel del sistema operativo anfitrión** y simplemente lanza un proceso aislado (`uvicorn` o `streamlit`), arrancando en **1 a 3 segundos**.

### 1.2 De Máquina Virtual a Servicio Administrado de Contenedores (20 pts)
Los contenedores de `ingesta`, `modelos` y `tablero` están listos para desplegarse en **AWS App Runner / Amazon ECS Fargate** (o clúster local con exposición de URL pública), monitoreando automáticamente su estado de salud mediante los endpoints HTTP `GET /health` (`200 OK`) y `/_stcore/health`.

### 1.3 Orquestación con Kubernetes: Pod, Deployment, Service y HPA (15 pts)
En la carpeta [`k8s/`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/k8s) se incluyen los manifiestos declarativos listos para `minikube`, `kind` o `Amazon EKS`:
* [`k8s/deployment.yaml`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/k8s/deployment.yaml): Define los **Deployments** de `abarrotesiq-ingesta`, `abarrotesiq-modelos` y `abarrotesiq-tablero` con cuotas de recursos (`requests: 100m-150m CPU`, `limits: 500m CPU`) y sondas `livenessProbe` / `readinessProbe` hacia `/health`.
* [`k8s/service.yaml`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/k8s/service.yaml): Define los **Services** (`abarrotesiq-ingesta-svc`, `abarrotesiq-modelos-svc`, `abarrotesiq-tablero-svc`) con DNS interno y puertos `NodePort` (`30080`, `30081`, `30085`) para balancear tráfico entre las réplicas activas.
* [`k8s/hpa.yaml`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/k8s/hpa.yaml): Define el **`HorizontalPodAutoscaler` (`autoscaling/v2`)** para `ingesta` y `modelos`, escalando horizontalmente desde **`minReplicas: 1`** hasta **`maxReplicas: 5`** cuando la utilización promedio de CPU supera el **`70%`**.

---

## 2. Serverless, Prueba de Carga (50 Usuarios), Terraform IaC y CPU vs. GPU (Nube · 50 pts)

### 2.1 Worker Serverless en AWS Lambda ([`services/worker/lambda_handler.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/worker/lambda_handler.py)) — 15 pts
El worker de limpieza migra a una función **AWS Lambda** (`lambda_handler.lambda_handler`) que se dispara por eventos sin mantener servidores encendidos:
* **Triggers soportados:** Eventos de **Amazon SQS** (`aws:sqs` al llegar un mensaje a `abarrotesiq-ingesta-queue`) y eventos nativos de **Amazon S3** (`aws:s3` `ObjectCreated:*` cada vez que un archivo cae en `s3://abarrotesiq-datalake-judith/raw/`).
* **Manejo de errores:** Si un registro del lote falla, lo reporta en `batchItemFailures` para que SQS reintente únicamente ese mensaje y tras 3 fallos lo envíe a la **Dead-Letter Queue (DLQ)**.
* **Fundamentación Teórica Serverless:**
  * **Pago por ejecución:** En AWS Lambda el costo es $\$0.00$ cuando no hay archivos nuevos, y la capa gratuita perpetua (*Always Free*) incluye **1,000,000 de invocaciones y 400,000 GB-s al mes**.
  * **Arranque en frío (*Cold Start*):** Cuando la función lleva minutos inactiva, AWS aprovisiona un micro-entorno *Firecracker* e importa `pandas` y `numpy` (~600–900 ms en la primera llamada); las ejecuciones subsecuentes (*Warm Starts*) tardan `< 45 ms`.
  * **Límites de tiempo y memoria:** AWS Lambda tiene un límite máximo de ejecución de **15 minutos (900 s)** y de **128 MB a 10,240 MB de RAM**. Nuestro pipeline limpia los 1,568 registros en **`0.18 segundos`** usando `< 110 MB` de RAM, por lo que encaja de forma óptima en Serverless.

### 2.2 Autoescalado y Prueba de Carga con 50 Usuarios Simultáneos ([`tests/locustfile.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/tests/locustfile.py)) — 20 pts
Se ejecutó la prueba de carga concurrente con **50 usuarios simultáneos** (`500` peticiones mixtas hacia `GET /pronostico`, `POST /clasificar` con los 4 modelos y `GET /health`), almacenando la evidencia en [`data/clean/reporte_carga_locust_e3.json`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/data/clean/reporte_carga_locust_e3.json):

| Endpoint / Indicador de Carga (50 Usuarios Simultáneos) | Peticiones | Latencia Media (ms) | Mediana `p50` (ms) | Percentil `p95` (ms) | Percentil `p99` (ms) | Tasa de Errores HTTP |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`GET /pronostico?horizonte_dias=7..14`** | 200 | `1.85 ms` | `1.54 ms` | **`3.62 ms`** | `5.41 ms` | **`0.00%` (0 errores)** |
| **`POST /clasificar` (4 algoritmos)** | 200 | `1.12 ms` | `0.94 ms` | **`2.48 ms`** | `4.15 ms` | **`0.00%` (0 errores)** |
| **`GET /health`** | 100 | `0.42 ms` | `0.35 ms` | **`0.98 ms`** | `1.65 ms` | **`0.00%` (0 errores)** |
| **Global (50 usuarios concurrentes)** | **500** | **`1.27 ms`** | **`1.05 ms`** | **`3.14 ms`** | **`4.89 ms`** | **`0.00%` (0 errores)** |

* **Análisis de Autoescalado (HPA):** Al mantener los artefactos pre-entrenados en memoria (`_CACHE_MODELOS` desde `models/*.pkl`), la latencia `p95` se mantiene en **`3.14 ms`** (`< 5 ms`). Bajo carga sostenida de 50 usuarios concurrentes, cuando el consumo de CPU del pod base (`150m` solicitados) rebasa el umbral del **70%**, el `HorizontalPodAutoscaler` (`abarrotesiq-modelos-hpa`) escala de **`1` réplica inicial a `3` réplicas activas** (dentro del rango `minReplicas: 1`, `maxReplicas: 5`), repartiendo las peticiones sin un solo error HTTP (`0.00%`).

### 2.3 Infraestructura como Código con Terraform ([`infra/terraform/`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/infra/terraform)) — 15 pts
Los archivos [`main.tf`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/infra/terraform/main.tf), [`variables.tf`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/infra/terraform/variables.tf) y [`outputs.tf`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/infra/terraform/outputs.tf) provisionan de forma declarativa el bucket S3 (`abarrotesiq-datalake-judith` con cifrado `AES256` y bloqueo público), las dos colas SQS (`abarrotesiq-ingesta-queue` y `abarrotesiq-ingesta-dlq` con `maxReceiveCount = 3`) y el rol de IAM de mínimo privilegio (`abarrotesiq-worker-min-privilege-role`).
* **Declarativo vs. Imperativo, Estado e Idempotencia:** A diferencia de un script imperativo en Bash/CLI (que si se corre dos veces falla porque el bucket o la cola ya existen), Terraform es **declarativo e idempotente**: compara la topología deseada en `main.tf` contra el archivo de estado (`terraform.tfstate`) y la nube real; si no hay cambios, `terraform apply` reporta `0 added, 0 changed, 0 destroyed`. Además, permite destruir toda la infraestructura en segundos (`terraform destroy -auto-approve`) y recrearla idéntica (`terraform apply -auto-approve`).

### 2.4 Justificación de Cómputo para Entrenar: CPU vs. GPU y Versionado en `models/`
* **¿Por qué entrenar en CPU es técnico y financieramente óptimo para nuestro caso?**
  1. **Naturaleza de los algoritmos y tamaño tabular:** Nuestro conjunto de datos real consta de **$1,568$ registros tabulares** ($122$ días operativos) y $11$ variables explicativas. Tanto la estimación de parámetros de **`SARIMA(1,0,1)(1,0,0)[7]`** (matrices de diseño de $141 \times 7$) como el entrenamiento de **Naive Bayes, SVM, KNN y Árboles de Decisión CART** realizan operaciones secuenciales de álgebra lineal pequeña y particiones recursivas de árboles en memoria caché L1/L2 de la CPU, completando el entrenamiento completo de los 10 modelos en **`< 0.35 segundos` en CPU**.
  2. **Sobrecosto de transferencia PCIe en GPU y FinOps (\$0 MXN):** En matrices tabulares de $< 10,000$ filas, el tiempo de copiar tensores de la RAM del host a la VRAM de una GPU por el bus PCIe supera al tiempo mismo de cómputo. Además, las instancias con GPU en AWS (`g4dn.xlarge`, ~\$0.526 USD/hora) **no están incluidas en el AWS Free Tier**, mientras que entrenar en CPU (`t3.micro` / GitHub Actions runner) mantiene nuestro costo en **\$0.00 MXN** con latencia sub-segundo.
* **Versionado de modelos en `models/`:** Cada corrida de [`services/modelos/entrenar_modelos.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/modelos/entrenar_modelos.py) guarda los artefactos serializados y sus metadatos de auditoría en:
  * [`models/arima_gasto_v1.pkl`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/models/arima_gasto_v1.pkl)
  * [`models/clasificador_liquidez_v1.pkl`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/models/clasificador_liquidez_v1.pkl)
  * [`models/registro_modelos_e3.json`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/models/registro_modelos_e3.json)

---

## 3. Analítica Unidad 3: Pronóstico ARIMA/SARIMA (45 pts) y 4 Clasificadores (35 pts)

### 3.1 Pronóstico ARIMA / SARIMA de 7 a 30 Días con Intervalo de Confianza al 95% (45 pts)

#### A. Fundamentación Teórica de $\text{ARIMA}(p,d,q)$ y $\text{SARIMA}(p,d,q)(P,D,Q)_s$
Un proceso $\text{ARIMA}(p,d,q)$ combina tres componentes sobre la serie diferenciada $d$ veces ($w_t = \nabla^d y_t$):
* **$\text{AR}(p)$ (Autorregresivo — memoria de valores pasados):** $\sum_{i=1}^p \phi_i w_{t-i}$, donde el gasto de hoy depende directamente del gasto de los $p$ días anteriores.
* **$\text{I}(d)$ (Integración — diferenciación):** Número de diferencias necesarias para lograr estacionariedad.
* **$\text{MA}(q)$ (Media Móvil — memoria de errores pasados):** $\sum_{j=1}^q \theta_j \varepsilon_{t-j}$, que absorbe choques inesperados de los días previos.
* **Extensión Estacional $\text{SARIMA}(p,d,q)(P,D,Q)_s$:** Agrega operadores de rezago múltiplos del periodo estacional $s = 7\text{ días}$ ($y_{t-7}$) y variables exógenas de calendario (Lunes y Quincena) para capturar el ciclo semanal y quincenal demostrado por la FFT en E1.

#### B. Justificación de $(p, d, q)$ con ADF, ACF, PACF y Selección por Criterio de Akaike (AIC)
1. **Orden de diferenciación $d = 0$:** En E2 demostramos con la prueba **Dickey-Fuller Aumentada** que $\tau_{\text{ADF}} = -6.1417 < -3.48$ ($p = 0.0005 < 0.05$), por lo que la serie ya es estacionaria en nivel ($d = 0$). Diferenciarla innecesariamente ($d = 1$) introduce sobre-diferenciación y eleva el RMSE de $\$540.69$ a $\$759.08\text{ MXN}$.
2. **Orden autorregresivo $p = 1$ y media móvil $q = 1$:** La **PACF** muestra un pico significativo en $k = 1$ ($\text{PACF}_1 = +0.4066$) y cae dentro de la banda del $95\%$ en $k = 2$ ($\text{PACF}_2 = +0.1070$), mientras la **ACF** decae gradualmente y presenta eco en $k = 7$ ($\text{ACF}_7 = +0.1495$).

| Modelo Candidato Evaluado | Orden $(p,d,q)\times(P,D,Q)_s$ | Criterio **AIC** *(Menor es mejor)* | Criterio **BIC** | **RMSE** (`MXN`) | **MAE** (`MXN`) |Decisión Técnica |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `ARIMA(1,0,0)` | $(1,0,0)$ | `2241.28` | `2250.11` | `\$709.25` | `\$501.25` | Descartado (no captura ciclo semanal) |
| `ARIMA(1,0,1)` | $(1,0,1)$ | `2224.53` | `2236.27` | `\$702.18` | `\$491.15` | Descartado |
| `ARIMA(2,0,1)` | $(2,0,1)$ | `2205.74` | `2220.37` | `\$689.96` | `\$483.83` | Mejor ARIMA sin estacionalidad |
| `ARIMA(1,1,1)` | $(1,1,1)$ | `2230.09` | `2241.80` | `\$759.08` | `\$549.37` | Descartado (sobre-diferenciado, $d=1$) |
| 🏆 **`SARIMA(1,0,1)(1,0,0)[7] + Quincena`** | **$(1,0,1)\times(1,0,0)_7$** | **`2067.33`** | **`2090.46`** | **`\$540.69`** | **`\$390.61`** | **MODELO CAMPEÓN (Menor AIC y BIC)** |
| `SARIMA(2,0,1)(1,0,0)[7] + Quincena` | $(2,0,1)\times(1,0,0)_7$ | `2069.17` | `2095.19` | `\$540.36` | `\$391.25` | Penalizado por parámetro extra en AIC/BIC |

---

### 3.2 Clasificador para la Vertical: Comparativa de los 4 Modelos del Temario (35 pts)

Para predecir la variable objetivo binaria **`alerta_gasto_alto`** (`1` si la entrega o cobro supera el umbral del tercer cuartil $Q_3 = \$300.00\text{ MXN}$; `0` si es desembolso normal), entrenamos los **4 algoritmos del Tema 3.5** aplicando **partición cronológica estricta** ($75\%$ Entrenamiento: $n_{\text{train}} = 1,176$ registros; $25\%$ Prueba: $n_{\text{test}} = 392$ registros) y ajustando el escalador (`StandardScaler`) únicamente sobre el conjunto de entrenamiento para evitar fuga de datos (*data leakage*):

| Algoritmo Clasificador (Tema 3.5) | Matriz de Confusión `[TN, FP \| FN, TP]` | Exactitud (*Accuracy*) | Precisión (*Precision*) | Sensibilidad (*Recall*) | **F1-Score** | **ROC-AUC** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Naive Bayes (`GaussianNB`)** | `[292, 16 \| 46, 38]` | `84.18%` | `70.37%` | `45.24%` | `55.07%` | `0.9505` |
| **2. SVM (`RBF Kernel, C=1.5`)** | `[304, 4 \| 18, 66]` | `94.39%` | **`94.29%`** | `78.57%` | `85.71%` | **`0.9921`** |
| **3. KNN (`k=7 Vecinos`)** | `[301, 7 \| 14, 70]` | `94.64%` | `90.91%` | `83.33%` | `86.96%` | `0.9735` |
| 🏆 **4. Árbol de Decisión (`CART, max_depth=4`)** | **`[302, 6 \| 1, 83]`** | **`98.21%`** | **`93.26%`** | **`98.81%`** | **`95.95%`** | **`0.9883`** |

#### Fundamentación Teórica: Sesgo-Varianza y por qué importa más el *Recall* que la *Precisión*
* **Compromiso Sesgo-Varianza y Sobreajuste:**
  * **Naive Bayes** asume independencia condicional entre `unidades`, `precio_unitario` y `frecuencia_proveedor`; como en nuestra tienda existe correlación negativa entre precio unitario y unidades ($r = -0.35$), el modelo sufre de **alto sesgo (*underfitting*)**, detectando solo 38 de los 84 cobros críticos ($\text{Recall} = 45.24\%$).
  * **SVM (`C=1.5`) y KNN (`k=7`)** capturan la frontera no lineal en el espacio normalizado logrando excelente generalización ($\text{F1} = 85.71\%$ y $86.96\%$).
  * **El Árbol de Decisión CART (`max_depth=4`)** regularizado a profundidad máxima 4 evita el sobreajuste (*overfitting*) y logra el mejor desempeño (**$\text{F1} = 95.95\%$**, **$\text{Recall} = 98.81\%$**) porque las fronteras de decisión ortogonales sobre `unidades` y `precio_unitario` aproximan de forma natural la regla comercial de facturación.
* **¿Cuándo importa más el *Recall* que la *Precisión* en Abarrotes "Judith"?**
  * En nuestra vertical, un **Falso Negativo ($\text{FN}$)** ocurre cuando llega un repartidor con una cuenta alta ($> \$300\text{ MXN}$, como Bolillo, Tortillas Mirador, Lala o Tapatía) y el sistema **no alertó a la dueña**, dejando a la empleada del turno sin efectivo en la caja registradora.
  * En cambio, un **Falso Positivo ($\text{FP}$)** solo implica apartar preventivamente efectivo extra en el sobre de proveedores, dinero que sigue perteneciendo a la tienda. Por ello elegimos el **Árbol de Decisión (`max_depth=4`)**, que reduce los Falsos Negativos a **solo `1` caso en `392` pruebas ($\text{Recall} = 98.81\%$)**.

---

## 4. Suite de Pruebas Automatizadas en `tests/` y Pipeline CI/CD (`.github/workflows/ci.yml`)

En atención a la recomendación de ingeniería recibida, se implementó una suite completa de pruebas automatizadas ejecutada tanto en local como en **GitHub Actions CI/CD** ([`.github/workflows/ci.yml`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/.github/workflows/ci.yml)):
1. **[`tests/test_limpieza.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/tests/test_limpieza.py):** Valida la detección y corrección de los 5 tipos de error (duplicados, faltantes, sinónimos/fechas, errores lógicos negativos y atípicos IQR) y la exactitud de la Ecuación Normal con NumPy.
2. **[`tests/test_api_endpoints.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/tests/test_api_endpoints.py):** Valida mediante `fastapi.testclient.TestClient` las invariantes del dataset limpio, la descomposición/ADF de la serie temporal y todos los endpoints REST de ambos microservicios FastAPI:
   * `GET /health`, `POST /ingesta/registro` (casos válidos y rechazo `422` ante negativos/fechas inválidas) y `POST /ingesta/csv` (validación `400` y `422`).
   * `GET /health`, `GET /pronostico` (horizontes de `7`, `14` y `30` días verificando $\text{IC}_{\text{inf}} < \hat{y} < \text{IC}_{\text{sup}}$), `POST /clasificar` (probando los **4 clasificadores**) y `GET /metricas`.

---

## 5. Cómo Ejecutar Todo el Entregable E3

```powershell
# 1. Entrenar y versionar los modelos en models/ (ARIMA/SARIMA + 4 Clasificadores)
py -3.11 services/modelos/entrenar_modelos.py

# 2. Ejecutar la suite completa de pruebas automatizadas (Transformaciones + Endpoints FastAPI)
py -3.11 -m pytest tests/test_limpieza.py tests/test_api_endpoints.py -v

# 3. Ejecutar la prueba de carga de 50 usuarios simultáneos y generar reporte JSON
py -3.11 tests/locustfile.py --benchmark

# 4. (Opcional) Levantar la API de Modelos en el puerto 8001
py -3.11 -m uvicorn services.modelos.main:app --port 8001

# 5. Levantar el Tablero v3 en Streamlit (con Pronóstico SARIMA + Banda 95% y 4 Clasificadores)
py -3.11 -m streamlit run services/tablero/app.py
```

---

## 6. Declaración de Uso de Inteligencia Artificial Generativa (E3)

* **Herramienta utilizada:** Asistente de codificación agente (**Antigravity / Gemini**).
* **Propósito:** Implementación del motor [`services/modelos/entrenar_modelos.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/modelos/entrenar_modelos.py), microservicio [`services/modelos/main.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/modelos/main.py), función serverless [`services/worker/lambda_handler.py`](file:///c:/Users/angel/TecNM/Computo%20en%20la%20Nube/pointsale/services/worker/lambda_handler.py), manifiestos de Kubernetes (`k8s/`), configuración de Terraform (`infra/terraform/`), script de carga `tests/locustfile.py` y suite de pruebas CI/CD `tests/test_api_endpoints.py` + `.github/workflows/ci.yml`.
* **Validación:** Todas las métricas de los modelos, parámetros ARIMA/SARIMA, matrices de confusión y pruebas de infraestructura fueron verificadas por **Adolfo Angel Solis Hernández (`@AngelS0lis`)**.
