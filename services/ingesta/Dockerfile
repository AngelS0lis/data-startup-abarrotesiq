FROM python:3.11-slim

WORKDIR /app

COPY services/ingesta/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY services/ingesta /app/services/ingesta
COPY data /app/data

EXPOSE 8000

CMD ["uvicorn", "services.ingesta.main:app", "--host", "0.0.0.0", "--port", "8000"]
