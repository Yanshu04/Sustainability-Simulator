# 🚀 Quick Start Guide

## 5-Minute Setup

### Step 1: Install Backend Dependencies

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Start Backend Server

In a new terminal:
```bash
cd backend
venv\Scripts\activate  # or source venv/bin/activate on Mac/Linux
python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

### Step 4: Start Frontend Server

In another new terminal:
```bash
cd frontend
npm start
```

The application will automatically open at `http://localhost:3000`

## 🎯 What You Can Do Now

1. **Create an Account**
   - Click "Sign Up" on the home page
   - Fill in username, email, and password
   - Click "Sign Up" button

2. **Create Your First Simulation**
   - Go to Dashboard
   - Click "+ New Simulation"
   - Fill in your lifestyle details (transport, diet, energy)
   - Click "Calculate Impact"

3. **Explore Improved Scenarios**
   - Adjust values in the "Improved Scenario" section
   - See real-time impact calculations
   - Compare against your current lifestyle

4. **View Recommendations**
   - See personalized suggestions
   - Explore potential savings
   - Understand environmental impact

## 📊 Demo Data

Try these values for a quick demonstration:

**Current Lifestyle:**
- Daily Car Distance: 30 km
- Car Type: Sedan
- Diet Type: Non-vegetarian
- Monthly Electricity: 400 kWh
- Monthly Water: 15,000 liters

**Improved Scenario:**
- Daily Car Distance: 15 km
- Car Type: Electric
- Diet Type: Vegetarian
- Monthly Electricity: 250 kWh
- Monthly Water: 10,000 liters

**Expected Savings:**
- ~1,200 kg CO₂/year
- ₹8,000-10,000/year

## 🆘 Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed: `python --version`
- Check if port 5000 is available
- Delete `sustainability.db` and try again

### Frontend won't start
- Ensure Node.js 16+ is installed: `node --version`
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is available

### API connection errors
- Ensure backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` in frontend `.env`

## 📚 Next Steps

1. **Understand the Code**
   - Read [Backend README](./backend/README.md)
   - Read [Frontend README](./frontend/README.md)

2. **Customize the Application**
   - Add more emission factors
   - Create additional scenarios
   - Extend the recommendation engine

3. **Deploy to Production**
   - Follow deployment guides in README.md
   - Set up proper environment variables
   - Use production databases

## 🎓 Learning Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Recharts Documentation](https://recharts.org/)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/)

## 💡 Tips

- Use browser DevTools to inspect network requests
- Check terminal output for error messages
- Keep both servers running while developing
- Refresh browser if changes don't appear

## 🤝 Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review API documentation in main [README.md](./README.md)
- Check backend/frontend README files

---

**Happy Coding! 🌱**
