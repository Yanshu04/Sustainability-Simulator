import React, { useState } from 'react';
import '../styles/SimulationForm.css';

export const LifestyleInputForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    daily_car_distance: 0,
    car_type: 'sedan',
    daily_bike_distance: 0,
    daily_walk_distance: 0,
    diet_type: 'mixed',
    meals_per_day: 3,
    monthly_electricity_kwh: 300,
    monthly_gas_usage: 0,
    monthly_water_liters: 10000,
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="lifestyle-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3>🚗 Transportation</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Daily Car Distance (km)</label>
            <input
              type="number"
              name="daily_car_distance"
              value={formData.daily_car_distance}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Car Type</label>
            <select name="car_type" value={formData.car_type} onChange={handleChange}>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="electric">Electric Car</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Daily Bike Distance (km)</label>
            <input
              type="number"
              name="daily_bike_distance"
              value={formData.daily_bike_distance}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Daily Walk Distance (km)</label>
            <input
              type="number"
              name="daily_walk_distance"
              value={formData.daily_walk_distance}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>🍽️ Diet</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Diet Type</label>
            <select name="diet_type" value={formData.diet_type} onChange={handleChange}>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="mixed">Mixed</option>
              <option value="non-vegetarian">Non-vegetarian</option>
            </select>
          </div>
          <div className="form-group">
            <label>Meals per Day</label>
            <input
              type="number"
              name="meals_per_day"
              value={formData.meals_per_day}
              onChange={handleChange}
              min="0"
              step="0.5"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>⚡ Utilities</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Monthly Electricity (kWh)</label>
            <input
              type="number"
              name="monthly_electricity_kwh"
              value={formData.monthly_electricity_kwh}
              onChange={handleChange}
              min="0"
              step="10"
            />
          </div>
          <div className="form-group">
            <label>Monthly Gas (therms)</label>
            <input
              type="number"
              name="monthly_gas_usage"
              value={formData.monthly_gas_usage}
              onChange={handleChange}
              min="0"
              step="1"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Monthly Water (liters)</label>
            <input
              type="number"
              name="monthly_water_liters"
              value={formData.monthly_water_liters}
              onChange={handleChange}
              min="0"
              step="100"
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        Calculate Impact
      </button>
    </form>
  );
};
