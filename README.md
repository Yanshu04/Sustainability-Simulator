# 🌱 What-If Sustainability Simulator

An AI-Based interactive system designed to help users understand how their daily lifestyle choices impact the environment through simulation of different scenarios.

## 📋 Project Overview

The **What-If Sustainability Simulator** enables users to:

- **Quantify Environmental Impact** of daily activities (transport, diet, energy)
- **Simulate Alternative Scenarios** to explore potential sustainability improvements
- **Visualize Results** with interactive charts and comparisons
- **Get Recommendations** for reducing environmental footprint

## 🎯 Key Features

- 🔐 **User Authentication** - Secure login and registration
- 📊 **Impact Analysis** - Calculate CO₂ emissions, water usage, and costs
- 🔄 **Scenario Comparison** - Compare current vs. improved lifestyle
- 📈 **Visual Insights** - Interactive charts for better understanding
- 💡 **Smart Recommendations** - Personalized suggestions for sustainability
- 💰 **Cost Savings** - See annual financial impact of sustainable choices
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **ORM**: SQLAlchemy

### Frontend
- **Framework**: React 18
- **Visualization**: Recharts
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: CSS3

## 📁 Project Structure

```
sustainable/
├── backend/                    # Flask API server
│   ├── app.py                 # Main application file
│   ├── requirements.txt        # Python dependencies
│   ├── .env                   # Environment variables
│   └── README.md              # Backend documentation
│
├── frontend/                   # React web application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── context/           # Auth context
│   │   ├── pages/             # Page components
│   │   ├── styles/            # CSS stylesheets
│   │   ├── api.js             # API client
│   │   ├── App.js             # Main app component
│   │   └── index.js           # React entry point
│   ├── package.json           # NPM dependencies
│   └── README.md              # Frontend documentation
│
├── .github/                    # GitHub configuration
│   └── copilot-instructions.md
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- npm or yarn (for frontend package management)

### Installation

#### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and set variables
cp .env.example .env
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (optional)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

## 🏃 Running the Application

### Terminal 1 - Start Backend Server

```bash
cd backend

# Activate virtual environment (if not already)
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

python app.py
```

Backend will run on: `http://localhost:5000`

### Terminal 2 - Start Frontend Server

```bash
cd frontend
npm start
```

Frontend will run on: `http://localhost:3000`

## 📊 Environmental Metrics

### Transport Emissions (kg CO₂ per km)
- **Sedan**: 0.192
- **SUV**: 0.256
- **Electric Car**: 0.050
- **Bike**: 0.0
- **Walking**: 0.0

### Dietary Emissions (kg CO₂ per meal)
- **Vegetarian**: 2.0
- **Vegan**: 1.0
- **Non-vegetarian**: 5.0
- **Mixed**: 3.5

### Utility Emissions
- **Electricity**: 0.82 kg CO₂/kWh (India avg)
- **Gas**: 5.3 kg CO₂/therm
- **Water**: 0.35 kg CO₂/1000L

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires token)

### Simulations
- `GET /api/simulations` - Get all user simulations
- `POST /api/simulations` - Create new simulation
- `GET /api/simulations/<id>` - Get specific simulation
- `PUT /api/simulations/<id>` - Update simulation
- `DELETE /api/simulations/<id>` - Delete simulation

### Recommendations
- `GET /api/recommendations/<id>` - Get personalized recommendations

## 🔑 Key Calculation Engine

The system uses standardized emission factors to calculate environmental impact:

```python
Annual CO₂ = (Transport + Diet + Utilities) × 12 months
```

### Example
- Driving 20km/day in sedan: 0.192 × 20 × 365 = 1,401 kg CO₂/year
- Non-vegetarian meals: 5.0 × 3 meals × 365 = 5,475 kg CO₂/year
- 400 kWh electricity: 0.82 × 400 × 12 = 3,936 kg CO₂/year

## 🎨 UI/UX Features

- **Professional Design**: Clean, modern interface aligned with sustainability theme
- **Responsive Layout**: Mobile-first responsive design
- **Interactive Visualizations**: Real-time updates with Recharts
- **Intuitive Forms**: Easy-to-use input forms with sliders and dropdowns
- **Visual Feedback**: Alerts, success messages, and loading states
- **Dark Mode Ready**: Extensible CSS custom properties for theming

## 🔮 Future Enhancements

- [ ] Real-time environmental APIs integration
- [ ] Machine learning-based recommendations
- [ ] Mobile application (React Native)
- [ ] Gamification (badges, challenges, leaderboards)
- [ ] Community features (compare with others)
- [ ] Data export (CSV, PDF reports)
- [ ] Integration with wearables and smart home devices

## 📚 Learning Outcomes

This project demonstrates:
- Full-stack web development (Frontend + Backend)
- RESTful API design
- Database modeling and ORM usage
- User authentication and authorization
- Data visualization techniques
- Environmental impact calculation
- Responsive UI/UX design

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the MIT License.

## ✉️ Support

For questions or issues, please create an issue in the repository or contact the development team.

---

**Created**: 2026
**Last Updated**: March 2026
**Version**: 1.0.0
