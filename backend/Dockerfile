FROM python:3.12-slim

# System deps (optional: libpq-dev, gcc if you need to compile wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python deps first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Security: don't run as root
RUN useradd -m appuser
USER appuser

# Start server: adjust module if your entry differs
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]