FROM python:3.11-slim

WORKDIR /app

COPY services/tablero/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY services /app/services
COPY data /app/data

EXPOSE 8501

CMD ["streamlit", "run", "services/tablero/app.py", "--server.address=0.0.0.0", "--server.port=8501"]
