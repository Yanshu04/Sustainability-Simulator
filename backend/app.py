"""
Sustainability Simulator Backend
AI-Based What-If Sustainability Simulator for Lifestyle Impact Analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///sustainability.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# ==================== Database Models ====================

class User(db.Model):
    """User model for authentication"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    simulations = db.relationship('Simulation', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class Simulation(db.Model):
    """Model to store user simulations"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(500))
    
    # Current lifestyle data
    daily_car_distance = db.Column(db.Float, default=0)
    car_type = db.Column(db.String(50), default='sedan')  # sedan, suv, electric
    daily_bike_distance = db.Column(db.Float, default=0)
    daily_walk_distance = db.Column(db.Float, default=0)
    
    diet_type = db.Column(db.String(50), default='mixed')  # vegetarian, non-vegetarian, vegan
    meals_per_day = db.Column(db.Float, default=3)
    
    monthly_electricity_kwh = db.Column(db.Float, default=300)
    monthly_gas_usage = db.Column(db.Float, default=0)  # in therms
    monthly_water_liters = db.Column(db.Float, default=10000)
    
    # Improved scenario data
    improved_daily_car_distance = db.Column(db.Float, default=0)
    improved_car_type = db.Column(db.String(50), default='electric')
    improved_daily_bike_distance = db.Column(db.Float, default=0)
    improved_daily_walk_distance = db.Column(db.Float, default=0)
    improved_diet_type = db.Column(db.String(50), default='vegetarian')
    improved_meals_per_day = db.Column(db.Float, default=3)
    improved_monthly_electricity_kwh = db.Column(db.Float, default=200)
    improved_monthly_gas_usage = db.Column(db.Float, default=0)
    improved_monthly_water_liters = db.Column(db.Float, default=7000)
    
    # Results (calculated)
    current_annual_emissions = db.Column(db.Float)  # kg CO2
    improved_annual_emissions = db.Column(db.Float)  # kg CO2
    annual_savings = db.Column(db.Float)  # kg CO2
    current_water_annual = db.Column(db.Float)  # liters
    improved_water_annual = db.Column(db.Float)  # liters
    current_cost_annual = db.Column(db.Float)  # USD
    improved_cost_annual = db.Column(db.Float)  # USD
    
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'current': {
                'car_distance': self.daily_car_distance,
                'car_type': self.car_type,
                'bike_distance': self.daily_bike_distance,
                'walk_distance': self.daily_walk_distance,
                'diet_type': self.diet_type,
                'meals_per_day': self.meals_per_day,
                'electricity_kwh': self.monthly_electricity_kwh,
                'gas_usage': self.monthly_gas_usage,
                'water_liters': self.monthly_water_liters,
            },
            'improved': {
                'car_distance': self.improved_daily_car_distance,
                'car_type': self.improved_car_type,
                'bike_distance': self.improved_daily_bike_distance,
                'walk_distance': self.improved_daily_walk_distance,
                'diet_type': self.improved_diet_type,
                'meals_per_day': self.improved_meals_per_day,
                'electricity_kwh': self.improved_monthly_electricity_kwh,
                'gas_usage': self.improved_monthly_gas_usage,
                'water_liters': self.improved_monthly_water_liters,
            },
            'results': {
                'current_annual_emissions': self.current_annual_emissions,
                'improved_annual_emissions': self.improved_annual_emissions,
                'annual_savings': self.annual_savings,
                'current_water_annual': self.current_water_annual,
                'improved_water_annual': self.improved_water_annual,
                'current_cost_annual': self.current_cost_annual,
                'improved_cost_annual': self.improved_cost_annual,
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# ==================== Emission Calculation Engine ====================

class EmissionCalculator:
    """
    Core calculation engine for environmental impact assessment
    Emission factors are based on standard sources (India-specific where applicable)
    """
    
    # Transport emission factors (kg CO2 per km)
    TRANSPORT_EMISSIONS = {
        'sedan': 0.192,           # ~192g CO2/km
        'suv': 0.256,             # ~256g CO2/km
        'electric': 0.050,        # ~50g CO2/km (grid dependent)
        'bike': 0.0,              # Zero emissions
        'walk': 0.0,              # Zero emissions
    }
    
    # Dietary emissions (kg CO2 per meal)
    DIET_EMISSIONS = {
        'vegetarian': 2.0,        # ~2 kg CO2/meal
        'vegan': 1.0,             # ~1 kg CO2/meal
        'non-vegetarian': 5.0,    # ~5 kg CO2/meal (includes meat/dairy)
        'mixed': 3.5,             # ~3.5 kg CO2/meal (average)
    }
    
    # Utilities emission factors
    ELECTRICITY_EMISSION_FACTOR = 0.82  # kg CO2/kWh (India avg)
    GAS_EMISSION_FACTOR = 5.3           # kg CO2/therm
    WATER_EMISSION_FACTOR = 0.35        # kg CO2/1000 liters
    
    # Cost estimates
    ELECTRICITY_COST_PER_KWH = 7.0      # INR per kWh (India avg)
    GAS_COST_PER_THERM = 80.0           # INR per therm
    WATER_COST_PER_1000L = 30.0         # INR per 1000L
    
    @staticmethod
    def calculate_transport_emissions(distance, car_type):
        """Calculate CO2 emissions from transportation"""
        emission_factor = EmissionCalculator.TRANSPORT_EMISSIONS.get(car_type, 0.192)
        return distance * emission_factor / 1000  # Convert to kg
    
    @staticmethod
    def calculate_diet_emissions(meals_per_day, diet_type):
        """Calculate CO2 emissions from diet"""
        emission_per_meal = EmissionCalculator.DIET_EMISSIONS.get(diet_type, 3.5)
        return meals_per_day * emission_per_meal / 1000  # Convert to kg
    
    @staticmethod
    def calculate_electricity_emissions(monthly_kwh):
        """Calculate CO2 emissions from electricity"""
        return monthly_kwh * EmissionCalculator.ELECTRICITY_EMISSION_FACTOR / 1000
    
    @staticmethod
    def calculate_gas_emissions(monthly_therms):
        """Calculate CO2 emissions from gas usage"""
        return monthly_therms * EmissionCalculator.GAS_EMISSION_FACTOR / 1000
    
    @staticmethod
    def calculate_water_emissions(monthly_liters):
        """Calculate CO2 emissions from water usage"""
        return (monthly_liters / 1000) * EmissionCalculator.WATER_EMISSION_FACTOR / 1000
    
    @staticmethod
    def calculate_annual_emissions(car_distance, car_type, bike_distance, walk_distance,
                                   meals_per_day, diet_type, monthly_electricity,
                                   monthly_gas, monthly_water):
        """Calculate total annual emissions"""
        
        # Daily emissions
        daily_transport_co2 = (
            EmissionCalculator.calculate_transport_emissions(car_distance, car_type) +
            EmissionCalculator.calculate_transport_emissions(bike_distance, 'bike') +
            EmissionCalculator.calculate_transport_emissions(walk_distance, 'walk')
        )
        
        daily_diet_co2 = EmissionCalculator.calculate_diet_emissions(meals_per_day, diet_type)
        
        # Monthly emissions
        monthly_electricity_co2 = EmissionCalculator.calculate_electricity_emissions(monthly_electricity)
        monthly_gas_co2 = EmissionCalculator.calculate_gas_emissions(monthly_gas)
        monthly_water_co2 = EmissionCalculator.calculate_water_emissions(monthly_water)
        
        # Annual total
        annual_transport_co2 = daily_transport_co2 * 365
        annual_diet_co2 = daily_diet_co2 * 365
        annual_utilities_co2 = (monthly_electricity_co2 + monthly_gas_co2 + monthly_water_co2) * 12
        
        return annual_transport_co2 + annual_diet_co2 + annual_utilities_co2
    
    @staticmethod
    def calculate_annual_cost(monthly_electricity, monthly_gas, monthly_water):
        """Calculate annual cost in INR"""
        electricity_cost = monthly_electricity * EmissionCalculator.ELECTRICITY_COST_PER_KWH
        gas_cost = monthly_gas * EmissionCalculator.GAS_COST_PER_THERM
        water_cost = (monthly_water / 1000) * EmissionCalculator.WATER_COST_PER_1000L
        return (electricity_cost + gas_cost + water_cost) * 12


# ==================== API Routes ====================

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User(username=data['username'], email=data['email'])
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing username or password'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict()), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Simulation Routes
@app.route('/api/simulations', methods=['GET'])
@jwt_required()
def get_simulations():
    """Get all user simulations"""
    try:
        user_id = get_jwt_identity()
        simulations = Simulation.query.filter_by(user_id=user_id).all()
        
        return jsonify([sim.to_dict() for sim in simulations]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/simulations/<int:sim_id>', methods=['GET'])
@jwt_required()
def get_simulation(sim_id):
    """Get a specific simulation"""
    try:
        user_id = get_jwt_identity()
        simulation = Simulation.query.filter_by(id=sim_id, user_id=user_id).first()
        
        if not simulation:
            return jsonify({'error': 'Simulation not found'}), 404
        
        return jsonify(simulation.to_dict()), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/simulations', methods=['POST'])
@jwt_required()
def create_simulation():
    """Create a new simulation"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        simulation = Simulation(
            user_id=user_id,
            name=data.get('name', 'New Simulation'),
            description=data.get('description', ''),
            daily_car_distance=data.get('daily_car_distance', 0),
            car_type=data.get('car_type', 'sedan'),
            daily_bike_distance=data.get('daily_bike_distance', 0),
            daily_walk_distance=data.get('daily_walk_distance', 0),
            diet_type=data.get('diet_type', 'mixed'),
            meals_per_day=data.get('meals_per_day', 3),
            monthly_electricity_kwh=data.get('monthly_electricity_kwh', 300),
            monthly_gas_usage=data.get('monthly_gas_usage', 0),
            monthly_water_liters=data.get('monthly_water_liters', 10000),
        )
        
        # Calculate initial results
        simulation.current_annual_emissions = EmissionCalculator.calculate_annual_emissions(
            simulation.daily_car_distance, simulation.car_type,
            simulation.daily_bike_distance, simulation.daily_walk_distance,
            simulation.meals_per_day, simulation.diet_type,
            simulation.monthly_electricity_kwh, simulation.monthly_gas_usage,
            simulation.monthly_water_liters
        )
        simulation.current_water_annual = simulation.monthly_water_liters * 12
        simulation.current_cost_annual = EmissionCalculator.calculate_annual_cost(
            simulation.monthly_electricity_kwh, simulation.monthly_gas_usage,
            simulation.monthly_water_liters
        )
        
        db.session.add(simulation)
        db.session.commit()
        
        return jsonify(simulation.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/simulations/<int:sim_id>', methods=['PUT'])
@jwt_required()
def update_simulation(sim_id):
    """Update simulation with improved scenario"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        simulation = Simulation.query.filter_by(id=sim_id, user_id=user_id).first()
        
        if not simulation:
            return jsonify({'error': 'Simulation not found'}), 404
        
        # Update current scenario if provided
        if 'current' in data:
            current = data['current']
            simulation.daily_car_distance = current.get('car_distance', simulation.daily_car_distance)
            simulation.car_type = current.get('car_type', simulation.car_type)
            simulation.daily_bike_distance = current.get('bike_distance', simulation.daily_bike_distance)
            simulation.daily_walk_distance = current.get('walk_distance', simulation.daily_walk_distance)
            simulation.diet_type = current.get('diet_type', simulation.diet_type)
            simulation.meals_per_day = current.get('meals_per_day', simulation.meals_per_day)
            simulation.monthly_electricity_kwh = current.get('electricity_kwh', simulation.monthly_electricity_kwh)
            simulation.monthly_gas_usage = current.get('gas_usage', simulation.monthly_gas_usage)
            simulation.monthly_water_liters = current.get('water_liters', simulation.monthly_water_liters)
        
        # Update improved scenario if provided
        if 'improved' in data:
            improved = data['improved']
            simulation.improved_daily_car_distance = improved.get('car_distance', simulation.improved_daily_car_distance)
            simulation.improved_car_type = improved.get('car_type', simulation.improved_car_type)
            simulation.improved_daily_bike_distance = improved.get('bike_distance', simulation.improved_daily_bike_distance)
            simulation.improved_daily_walk_distance = improved.get('walk_distance', simulation.improved_daily_walk_distance)
            simulation.improved_diet_type = improved.get('diet_type', simulation.improved_diet_type)
            simulation.improved_meals_per_day = improved.get('meals_per_day', simulation.improved_meals_per_day)
            simulation.improved_monthly_electricity_kwh = improved.get('electricity_kwh', simulation.improved_monthly_electricity_kwh)
            simulation.improved_monthly_gas_usage = improved.get('gas_usage', simulation.improved_monthly_gas_usage)
            simulation.improved_monthly_water_liters = improved.get('water_liters', simulation.improved_monthly_water_liters)
        
        # Recalculate results
        simulation.current_annual_emissions = EmissionCalculator.calculate_annual_emissions(
            simulation.daily_car_distance, simulation.car_type,
            simulation.daily_bike_distance, simulation.daily_walk_distance,
            simulation.meals_per_day, simulation.diet_type,
            simulation.monthly_electricity_kwh, simulation.monthly_gas_usage,
            simulation.monthly_water_liters
        )
        
        simulation.improved_annual_emissions = EmissionCalculator.calculate_annual_emissions(
            simulation.improved_daily_car_distance, simulation.improved_car_type,
            simulation.improved_daily_bike_distance, simulation.improved_daily_walk_distance,
            simulation.improved_meals_per_day, simulation.improved_diet_type,
            simulation.improved_monthly_electricity_kwh, simulation.improved_monthly_gas_usage,
            simulation.improved_monthly_water_liters
        )
        
        simulation.annual_savings = simulation.current_annual_emissions - simulation.improved_annual_emissions
        simulation.current_water_annual = simulation.monthly_water_liters * 12
        simulation.improved_water_annual = simulation.improved_monthly_water_liters * 12
        
        simulation.current_cost_annual = EmissionCalculator.calculate_annual_cost(
            simulation.monthly_electricity_kwh, simulation.monthly_gas_usage,
            simulation.monthly_water_liters
        )
        
        simulation.improved_cost_annual = EmissionCalculator.calculate_annual_cost(
            simulation.improved_monthly_electricity_kwh, simulation.improved_monthly_gas_usage,
            simulation.improved_monthly_water_liters
        )
        
        db.session.commit()
        
        return jsonify(simulation.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/simulations/<int:sim_id>', methods=['DELETE'])
@jwt_required()
def delete_simulation(sim_id):
    """Delete a simulation"""
    try:
        user_id = get_jwt_identity()
        simulation = Simulation.query.filter_by(id=sim_id, user_id=user_id).first()
        
        if not simulation:
            return jsonify({'error': 'Simulation not found'}), 404
        
        db.session.delete(simulation)
        db.session.commit()
        
        return jsonify({'message': 'Simulation deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations/<int:sim_id>', methods=['GET'])
@jwt_required()
def get_recommendations(sim_id):
    """Get personalized recommendations based on simulation"""
    try:
        user_id = get_jwt_identity()
        simulation = Simulation.query.filter_by(id=sim_id, user_id=user_id).first()
        
        if not simulation:
            return jsonify({'error': 'Simulation not found'}), 404
        
        recommendations = generate_recommendations(simulation)
        
        return jsonify(recommendations), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Recommendation Engine ====================

def generate_recommendations(simulation):
    """
    Generate personalized recommendations based on user's current lifestyle
    """
    recommendations = []
    
    # Transport recommendations
    if simulation.daily_car_distance > 10:
        potential_savings = (simulation.daily_car_distance * 0.192 * 365) / 1000
        recommendations.append({
            'category': 'Transport',
            'suggestion': 'Switch to an electric car',
            'impact': f'Reduce emissions by ~{int(potential_savings)}kg CO2/year',
            'priority': 'high' if potential_savings > 1000 else 'medium',
            'details': 'Electric vehicles produce 75% fewer emissions than conventional cars.'
        })
    
    if simulation.daily_car_distance > 5 and simulation.daily_bike_distance == 0:
        bike_savings = (simulation.daily_car_distance * 0.5 * 0.192 * 365) / 1000
        recommendations.append({
            'category': 'Transport',
            'suggestion': 'Bike for 50% of short trips',
            'impact': f'Reduce emissions by ~{int(bike_savings)}kg CO2/year',
            'priority': 'medium',
            'details': 'Cycling for nearby trips eliminates emissions and improves fitness.'
        })
    
    # Diet recommendations
    if simulation.diet_type == 'non-vegetarian':
        diet_savings = ((5.0 - 2.0) * simulation.meals_per_day * 365) / 1000
        recommendations.append({
            'category': 'Diet',
            'suggestion': 'Switch to vegetarian meals',
            'impact': f'Reduce emissions by ~{int(diet_savings)}kg CO2/year',
            'priority': 'high' if diet_savings > 500 else 'medium',
            'details': 'Vegetarian diet requires 60% less water and produces fewer emissions.'
        })
    
    if simulation.diet_type == 'vegetarian' and simulation.meals_per_day > 2:
        vegan_savings = ((2.0 - 1.0) * simulation.meals_per_day * 365) / 1000
        recommendations.append({
            'category': 'Diet',
            'suggestion': 'Include vegan meals 3-4 times per week',
            'impact': f'Reduce emissions by ~{int(vegan_savings)}kg CO2/year',
            'priority': 'medium',
            'details': 'Vegan diet has the lowest environmental footprint.'
        })
    
    # Energy recommendations
    if simulation.monthly_electricity_kwh > 400:
        energy_savings = (simulation.monthly_electricity_kwh - 250) * 0.82 * 12 / 1000
        recommendations.append({
            'category': 'Energy',
            'suggestion': 'Reduce electricity usage by 30%',
            'impact': f'Reduce emissions by ~{int(energy_savings)}kg CO2/year',
            'priority': 'medium',
            'details': 'Use LED bulbs, unplug devices, and improve insulation.'
        })
    
    if simulation.monthly_electricity_kwh > 300:
        solar_savings = (simulation.monthly_electricity_kwh * 0.82 * 12) / 1000
        recommendations.append({
            'category': 'Energy',
            'suggestion': 'Install solar panels',
            'impact': f'Eliminate ~{int(solar_savings)}kg CO2/year',
            'priority': 'high',
            'details': 'Solar panels can provide 70-80% of household electricity needs.'
        })
    
    # Water recommendations
    if simulation.monthly_water_liters > 12000:
        water_savings = (simulation.monthly_water_liters - 8000) * 12 * 0.35 / 1000000
        recommendations.append({
            'category': 'Water',
            'suggestion': 'Reduce water consumption by 20%',
            'impact': f'Reduce emissions by ~{water_savings:.1f}kg CO2/year',
            'priority': 'low',
            'details': 'Use water-efficient fixtures and reduce shower time.'
        })
    
    return {
        'current_emissions': simulation.current_annual_emissions,
        'recommendations': recommendations,
        'total_potential_savings': sum([r.get('priority') == 'high' for r in recommendations])
    }


# ==================== Error Handlers ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


# ==================== Database Initialization ====================

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Simulation': Simulation}


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
