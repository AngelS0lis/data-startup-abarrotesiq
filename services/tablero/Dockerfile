# Multi-stage Dockerfile sin secretos para el Tablero Empresarial v3 (Entregable E3)
FROM python:3.11-slim AS builder

WORKDIR /build
COPY services/tablero/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim AS runtime

WORKDIR /app
COPY --from=builder /install /usr/local
COPY services /app/services
COPY data /app/data
COPY models /app/models

RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8501

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8501/_stcore/health')" || exit 1

CMD ["streamlit", "run", "services/tablero/app.py", "--server.address=0.0.0.0", "--server.port=8501"]
