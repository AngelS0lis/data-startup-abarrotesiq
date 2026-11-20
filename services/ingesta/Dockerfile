# Multi-stage Dockerfile sin secretos para el Microservicio de Ingesta (Entregable E3)
FROM python:3.11-slim AS builder

WORKDIR /build
COPY services/ingesta/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim AS runtime

WORKDIR /app
COPY --from=builder /install /usr/local
COPY services/ingesta /app/services/ingesta
COPY data/raw /app/data/raw

RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "services.ingesta.main:app", "--host", "0.0.0.0", "--port", "8000"]
