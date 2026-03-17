#!/bin/bash
# Quick Setup Script for Sustainability Simulator

echo "🌱 What-If Sustainability Simulator - Quick Setup"
echo "=================================================="

# Backend Setup
echo ""
echo "📦 Setting up Backend..."
cd backend

echo "Creating virtual environment..."
python -m venv venv

echo "Activating virtual environment..."
# For Windows, use: venv\Scripts\activate
# For macOS/Linux, use: source venv/bin/activate
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  source venv/Scripts/activate
else
  source venv/bin/activate
fi

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Backend setup complete!"

# Frontend Setup
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend

echo "Installing npm dependencies..."
npm install

echo "✅ Frontend setup complete!"

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "To run the application:"
echo "1. Open Terminal 1 and run: cd backend && python app.py"
echo "2. Open Terminal 2 and run: cd frontend && npm start"
echo ""
echo "Application will be available at http://localhost:3000"
