# Multi-stage Dockerfile sin secretos para el Worker de Limpieza (Entregable E3)
FROM python:3.11-slim AS builder

WORKDIR /build
COPY services/worker/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim AS runtime

WORKDIR /app
COPY --from=builder /install /usr/local
COPY services/worker /app/services/worker
COPY data /app/data

RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

CMD ["python", "services/worker/worker.py"]
