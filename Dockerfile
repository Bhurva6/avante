# Use Python base image
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend package files
COPY frontend-nextjs/package*.json ./frontend-nextjs/

# Install Node dependencies
WORKDIR /app/frontend-nextjs
RUN npm install

# Copy all source code
WORKDIR /app
COPY . .

# Build Next.js frontend
WORKDIR /app/frontend-nextjs
RUN npm run build

# Go back to app root
WORKDIR /app

# Make entrypoint executable
RUN chmod +x entrypoint.py

# Expose port (Railway sets PORT env var)
EXPOSE 8080

# Use Python entrypoint to handle PORT properly
CMD ["python3", "entrypoint.py"]
