@echo off
REM Quick Setup Script for Sustainability Simulator (Windows)

echo.
echo 🌱 What-If Sustainability Simulator - Quick Setup
echo ==================================================
echo.

REM Backend Setup
echo 📦 Setting up Backend...
cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo ✅ Backend setup complete!

REM Frontend Setup
echo.
echo 📦 Setting up Frontend...
cd ..\frontend

echo Installing npm dependencies...
call npm install

echo ✅ Frontend setup complete!

echo.
echo 🎉 Setup Complete!
echo.
echo To run the application:
echo 1. Open Command Prompt 1 and run: cd backend ^&^& python app.py
echo 2. Open Command Prompt 2 and run: cd frontend ^&^& npm start
echo.
echo Application will be available at http://localhost:3000
pause
