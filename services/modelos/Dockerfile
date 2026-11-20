# Multi-stage Dockerfile sin secretos para el Servicio de Modelos (Entregable E3)
FROM python:3.11-slim AS builder

WORKDIR /build
COPY services/modelos/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim AS runtime

WORKDIR /app
COPY --from=builder /install /usr/local
COPY services/modelos /app/services/modelos
COPY services/worker/limpieza.py /app/services/worker/limpieza.py
COPY data/clean /app/data/clean
COPY models /app/models

RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

CMD ["uvicorn", "services.modelos.main:app", "--host", "0.0.0.0", "--port", "8001"]
