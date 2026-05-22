#!/bin/bash

# Q-Shield Quick Start Script
echo "🛡️  Starting Q-Shield..."

# Check if backend .env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "✅ Please edit backend/.env and add your DEPLOYER_MNEMONIC"
fi

# Check if frontend .env exists
if [ ! -f frontend/.env ]; then
    echo "⚠️  frontend/.env not found. Creating from example..."
    cp frontend/.env.example frontend/.env
fi

# Start backend in background
echo "🔧 Starting backend on port 5001..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on port 5173..."
cd frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
