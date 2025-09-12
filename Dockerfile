# Root-level Dockerfile that builds the FastAPI backend located under ./backend

FROM python:3.12-slim

# System deps (optional but useful for manylibs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies (from backend/)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend application code into the image
# (Assumes your FastAPI code is under backend/app)
COPY backend/app /app/app

# If you have other backend files that your app needs at runtime,
# copy them explicitly, e.g.:
# COPY backend/app/prompts.py /app/app/prompts.py
# COPY backend/app/openai_client.py /app/app/openai_client.py
# (The line above is unnecessary if they’re already under backend/app which we copied)

# Set env + expose port
ENV PORT=8000
EXPOSE 8000

# Run the FastAPI app
CMD ["sh", "-lc", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]