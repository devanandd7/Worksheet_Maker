@echo off
echo ========================================
echo Worksheet AI System - Setup Script
echo ========================================
echo.

echo [1/4] Setting up Backend...
cd backend
echo Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo [2/4] Setting up Frontend...
cd ..\frontend
echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo [3/4] Checking Environment Configuration...
cd ..\backend
if not exist .env (
    echo WARNING: .env file not found in backend folder!
    echo Please create backend/.env file with your credentials.
    echo See backend/.env.example for reference.
) else (
    echo .env file found!
)
echo.

echo [4/4] Setup Complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Configure backend/.env with your credentials:
echo    - MongoDB Atlas connection string
echo    - Cloudinary credentials (cloud_name, api_key, api_secret)
echo    - Google Gemini API key
echo    - JWT secret (any random string)
echo.
echo 2. Start the application:
echo    - Open TWO terminal windows
echo    - Terminal 1: cd backend ^&^& npm run dev
echo    - Terminal 2: cd frontend ^&^& npm start
echo.
echo 3. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo.
echo ========================================
echo For detailed setup guide, see README.md
echo ========================================
echo.
pause
