#!/bin/bash

# Cleanup function to kill background processes
cleanup() {
  echo "Stopping all services..."
  kill $(jobs -p) 2>/dev/null
  exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

echo "🚀 Starting PortSentinel Development Services..."

# check if node_modules exists in backend and frontend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing Backend Dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing Frontend Dependencies..."
    cd frontend && npm install && cd ..
fi

# Start Backend
echo "📡 Starting Backend Service (Port 3001)..."
cd backend && npm start &
BACKEND_PID=$!

# Start Host Agent (for native monitoring)
if [ ! -d "host-agent/node_modules" ]; then
    echo "📦 Installing Host Agent Dependencies..."
    cd host-agent && npm install && cd ..
fi

echo "🕵️  Starting Host Agent (Port 3002)..."
cd host-agent && npm start &
HOST_AGENT_PID=$!

# Start Frontend
echo "💻 Starting Frontend (Vite)..."
cd frontend && npm run dev

# Wait for frontend to close or user interrupt
wait
