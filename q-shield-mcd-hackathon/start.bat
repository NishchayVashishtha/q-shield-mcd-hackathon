@echo off
REM Q-Shield Quick Start Script for Windows

echo 🛡️  Starting Q-Shield...

REM Check if backend .env exists
if not exist backend\.env (
    echo ⚠️  backend\.env not found. Creating from example...
    copy backend\.env.example backend\.env
    echo ✅ Please edit backend\.env and add your DEPLOYER_MNEMONIC
)

REM Check if frontend .env exists
if not exist frontend\.env (
    echo ⚠️  frontend\.env not found. Creating from example...
    copy frontend\.env.example frontend\.env
)

echo 🔧 Starting backend on port 5001...
start cmd /k "cd backend && python app.py"

timeout /t 3 /nobreak > nul

echo 🎨 Starting frontend on port 5173...
cd frontend
npm run dev
