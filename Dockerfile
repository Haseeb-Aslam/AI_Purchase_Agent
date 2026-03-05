# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + serve frontend static
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/config.py backend/database.py backend/main.py ./
COPY backend/models/ ./models/
COPY backend/routes/ ./routes/
COPY backend/services/ ./services/
COPY --from=frontend /app/frontend/dist ./static

ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
