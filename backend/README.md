# Backend Documentation

## Flask API Server for Sustainability Simulator

### Setup Instructions

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Set your environment variables
   - Change JWT secret in production

5. **Run Application**
   ```bash
   python app.py
   ```

Server will start on `http://localhost:5000`

### Database

SQLite database will be created automatically on first run as `sustainability.db`

### Environment Variables

```
FLASK_ENV=development
DATABASE_URL=sqlite:///sustainability.db
JWT_SECRET_KEY=your-secret-key-change-in-production
```

### Key Modules

- **EmissionCalculator**: Core calculation engine
- **User**: User authentication model
- **Simulation**: User simulation model
- **Recommendation Engine**: Personalized suggestions

### API Endpoints

All endpoints require JWT authentication (except `/register` and `/login`)

See main README.md for complete API documentation.
