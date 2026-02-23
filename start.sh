#!/bin/bash
# Start Script for Orthopedic Dashboard
# Runs both Flask backend and Next.js frontend

echo "🚀 Starting Orthopedic Implant Analytics Dashboard"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found!"
    echo "Please run this script from the dashboard root directory"
    exit 1
fi

# Kill any existing processes on ports 5000 and 3000
echo "${YELLOW}Cleaning up previous processes...${NC}"
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start Flask Backend
echo ""
echo "${GREEN}Starting Flask Backend (port 5000)...${NC}"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || true
pip install -q -r requirements.txt 2>/dev/null || true

python app.py &
FLASK_PID=$!
echo "✅ Flask Backend started (PID: $FLASK_PID)"

# Wait for Flask to start
sleep 3

# Start Next.js Frontend
echo ""
echo "${GREEN}Starting Next.js Frontend (port 3000)...${NC}"
cd frontend-nextjs
npm run dev &
NEXTJS_PID=$!
echo "✅ Next.js Frontend started (PID: $NEXTJS_PID)"

echo ""
echo "${GREEN}================================================${NC}"
echo "${GREEN}✨ Dashboard is Ready!${NC}"
echo "${GREEN}================================================${NC}"
echo ""
echo "📊 Frontend:  http://localhost:3000"
echo "🔌 Backend:   http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for processes
wait $FLASK_PID $NEXTJS_PID
