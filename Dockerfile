# Use Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy Python requirements first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code only (frontend is deployed separately on Vercel)
COPY app.py frontend_integration.py entrypoint.py ./
COPY src ./src

# Expose port (Render sets PORT env var)
EXPOSE 8080

# Use Python entrypoint to handle PORT properly
CMD ["python3", "entrypoint.py"]
