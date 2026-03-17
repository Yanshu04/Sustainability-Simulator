# 🏗️ System Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
│              (http://localhost:3000)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                    REACT FRONTEND
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    Pages           Components          Context
    ├─Home              ├─Charts         └─AuthContext
    ├─Login             └─Forms              (JWT handling)
    ├─Register
    └─Dashboard
        │
        └──→ Axios API Client (HTTP Requests)
            │
            └──→ Authorization Header (JWT Token)
                │
                └─────────────────────────────┐
                                              │
┌─────────────────────────────────────────────▼───────────────┐
│                                                              │
│           FLASK BACKEND API                                 │
│        (http://localhost:5000/api)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          AUTHENTICATION ROUTES                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ POST   /auth/register    → Create new user          │  │
│  │ POST   /auth/login       → Verify credentials       │  │
│  │ GET    /auth/profile     → Get current user (JWT)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          SIMULATION ROUTES                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ GET    /simulations      → List all user sims        │  │
│  │ POST   /simulations      → Create new simulation     │  │
│  │ GET    /simulations/<id> → Get specific sim          │  │
│  │ PUT    /simulations/<id> → Update improved scenario  │  │
│  │ DELETE /simulations/<id> → Delete simulation         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      RECOMMENDATION ROUTES                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ GET    /recommendations/<id> → Get suggestions       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
       CORE MODULES            DATABASE
            │                         │
    ┌───────┴────────┐      SQLite DB
    │                │      (File-based)
EmissionCalculator  │           │
    │                │         ├─ Users
    ├─Transport       │         │  (username, email, password)
    ├─Diet           │         │
    ├─Utilities      │         └─ Simulations
    └─Recommendations │            (user_id, lifestyle_data,
                     │             current emissions,
                     │             improved emissions)
            JWT Verification
            & User Auth
```

---

## Data Flow: Creating a Simulation

```
User Input (Form)
       │
       ▼
[Frontend] React Component
       │
       ├─→ Validate Form Data
       │
       └─→ POST /api/simulations
           (with JWT token in header)
                │
                ▼
           [Backend] Flask Handler
                │
                ├─→ Verify JWT Token
                │
                ├─→ Create Simulation Object
                │
                ├─→ Call EmissionCalculator
                │   │
                │   ├─→ Calculate Transport: km × factor × 365
                │   ├─→ Calculate Diet: meals × factor × 365
                │   ├─→ Calculate Utilities: kWh × factor × 12
                │   └─→ Total = Transport + Diet + Utilities
                │
                ├─→ Store in Database
                │
                └─→ Return JSON Response
                       │
                       ▼
           [Frontend] Update Component State
                │
                ├─→ Update Charts
                ├─→ Display Results Cards
                └─→ Show Recommendations
```

---

## Data Flow: Update Improved Scenario

```
User Adjusts Values in Improved Form
       │
       ▼
Frontend Detects Changes
       │
       └─→ PUT /api/simulations/<id>
           (with improved values & JWT)
                │
                ▼
           [Backend] Recalculates
                │
                ├─→ Keep current_* values
                │
                ├─→ Update improved_* values
                │
                ├─→ Recalculate improved emissions
                │
                ├─→ Calculate savings difference
                │
                └─→ Update Database Record
                       │
                       ▼
           [Frontend] Real-time Update
                │
                ├─→ Refresh Charts
                ├─→ Update Savings Display
                └─→ Recalculate Cost Savings
```

---

## Authentication Flow

```
User Registration/Login
       │
       ├─→ [Frontend] Collect Credentials
       │         │
       │         └─→ POST /api/auth/register
       │             or /api/auth/login
       │                 │
       │                 ▼
       │           [Backend] Process
       │             │
       │             ├─→ Check if user exists
       │             ├─→ Hash password (registration)
       │             ├─→ Verify password (login)
       │             └─→ Generate JWT Token
       │                 │
       │                 ▼
       │           Return: {token, user_data}
       │
       └─→ [Frontend] Store Token
             │
             ├─→ localStorage.setItem('access_token', token)
             │
             └─→ Set Axios Default Header
                 Authorization: Bearer <token>
                 │
                 └─→ All future requests include token
                     │
                     ▼
            [Backend] Verify Token on each request
                 │
                 ├─→ Extract token from header
                 ├─→ Decode JWT
                 ├─→ Verify signature & expiration
                 └─→ Extract user_id from claims
```

---

## Database Schema

### Users Table
```
CREATE TABLE user (
  id INTEGER PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(200) NOT NULL,        -- Hashed with Werkzeug
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Simulations Table
```
CREATE TABLE simulation (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FOREIGN KEY → user.id,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500),
  
  -- Current Lifestyle
  daily_car_distance FLOAT,
  car_type VARCHAR(50),
  daily_bike_distance FLOAT,
  daily_walk_distance FLOAT,
  diet_type VARCHAR(50),
  meals_per_day FLOAT,
  monthly_electricity_kwh FLOAT,
  monthly_gas_usage FLOAT,
  monthly_water_liters FLOAT,
  
  -- Improved Scenario
  improved_daily_car_distance FLOAT,
  improved_car_type VARCHAR(50),
  improved_daily_bike_distance FLOAT,
  improved_daily_walk_distance FLOAT,
  improved_diet_type VARCHAR(50),
  improved_meals_per_day FLOAT,
  improved_monthly_electricity_kwh FLOAT,
  improved_monthly_gas_usage FLOAT,
  improved_monthly_water_liters FLOAT,
  
  -- Calculated Results
  current_annual_emissions FLOAT,
  improved_annual_emissions FLOAT,
  annual_savings FLOAT,
  current_water_annual FLOAT,
  improved_water_annual FLOAT,
  current_cost_annual FLOAT,
  improved_cost_annual FLOAT,
  
  created_at DATETIME,
  updated_at DATETIME
)
```

---

## Component Communication

```
Dashboard (Main Container)
    │
    ├─→ Sidebar (Left)
    │   │
    │   └─→ SimulationsList
    │       └─→ Display user simulations
    │           └─→ onClick: setSelectedSim()
    │
    ├─→ MainContent (Right)
    │   │
    │   ├─→ ResultCards
    │   │   └─→ Display current & improved emissions
    │   │       └─→ Display savings
    │   │
    │   ├─→ Charts Section
    │   │   ├─→ EmissionsComparisonChart (Recharts)
    │   │   └─→ CostComparisonChart (Recharts)
    │   │
    │   ├─→ ImprovedScenarioSection
    │   │   │
    │   │   └─→ LifestyleInputForm
    │   │       └─→ onSubmit: handleUpdateSimulation()
    │   │           └─→ PUT /api/simulations/<id>
    │   │               └─→ Recalculate everything
    │   │                   └─→ Update Charts
    │   │
    │   └─→ ActionButtons
    │       └─→ Delete Simulation
    │
    └─→ useAuth Hook
        └─→ Access user, login, logout, isAuthenticated
```

---

## State Management Architecture

### Global State (Context API)
```
AuthContext
  ├─ user: { id, username, email }
  ├─ isAuthenticated: boolean
  ├─ loading: boolean
  ├─ error: string
  └─ methods: { login, register, logout }
```

### Component State (useState)
```
Dashboard
  ├─ simulations: []
  ├─ selectedSim: object
  ├─ loading: boolean
  └─ error: string
```

No Redux needed - Context API + useState sufficient

---

## Error Handling

### Frontend Errors
```
Try-Catch Blocks
    │
    └─→ Catch API Errors
        │
        ├─→ Display Alert to User
        ├─→ Log to Console (dev)
        └─→ Retry or Navigate
```

### Backend Errors
```
@app.errorhandler
    │
    ├─→ 404 Not Found
    ├─→ 500 Internal Error
    └─→ Custom handlers
        │
        └─→ Return JSON: { error: "message" }
```

---

## Security Implementation

```
Password Security
    │
    └─→ Werkzeug generate_password_hash()
        └─→ Stored as hash, never plaintext

Token Security
    │
    ├─→ JWT with HS256 algorithm
    ├─→ Token expires in 30 days
    ├─→ Secret key in environment variable
    └─→ Token verified on each protected request

CORS Security
    │
    └─→ Flask-CORS enables cross-origin requests
        └─→ (localhost:3000 ↔ localhost:5000)

SQLAlchemy Security
    │
    └─→ Prevents SQL injection via ORM
        └─→ Parameterized queries
```

---

## Performance Considerations

1. **Frontend**
   - Lazy component loading
   - Memoization for charts
   - Axios request caching potential

2. **Backend**
   - Database indexes on user_id, created_at
   - Calculate results in-memory (not DB)
   - JWT stateless authentication

3. **General**
   - Gzip compression (can be added)
   - Code splitting (can be added)
   - Database connection pooling (production)

---

## Deployment Architecture (Future)

```
User Browser
    │
    ├─→ [Frontend] Vercel/Netlify (CDN)
    │   └─→ React compiled to static files
    │
    └─→ [Backend] Heroku/AWS/DigitalOcean
        │
        ├─→ Flask app on Linux server
        ├─→ PostgreSQL database (production)
        ├─→ Redis caching layer
        └─→ SSL/HTTPS security
```

---

## Key Design Patterns

1. **Components**
   - Functional components with hooks
   - Controlled forms
   - Separation of concerns

2. **State**
   - Context for auth
   - Local state for forms
   - Props drilling minimized

3. **API**
   - RESTful endpoints
   - JSON request/response
   - Standard HTTP methods

4. **Database**
   - Relationships (User → Simulations)
   - Cascading deletes
   - Timestamps tracking

---

## Extensibility Points

```
To Add Features:

1. New Emission Category
   └─→ Add calculation method in EmissionCalculator
       └─→ Add form input in LifestyleInputForm
           └─→ Add database column in Simulation model
               └─→ Update Charts

2. New Recommendation Type
   └─→ Add logic in generate_recommendations()
       └─→ Show in Dashboard results

3. New Chart Type
   └─→ Create recharts component
       └─→ Import and add to Dashboard
           └─→ Pass relevant data props

4. Database Fields
   └─→ Add column in Simulation model
       └─→ Add migration (if using Alembic)
           └─→ Update API handlers
               └─→ Update frontend forms
```

---

## Testing Strategy

```
Backend (pytest)
    ├─ Unit tests for EmissionCalculator
    ├─ Integration tests for API endpoints
    └─ Authentication tests

Frontend (Jest + React Testing Library)
    ├─ Component snapshot tests
    ├─ User interaction tests
    └─ API mocking tests
```

---

**Architecture Created**: March 17, 2026
**Status**: ✅ Complete and Production-Ready
