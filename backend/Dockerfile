# Backend only - use from project root with docker-compose
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/config.py backend/database.py backend/main.py ./
COPY backend/models/ ./models/
COPY backend/routes/ ./routes/
COPY backend/services/ ./services/

ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
