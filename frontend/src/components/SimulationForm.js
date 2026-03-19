import React, { useEffect, useMemo, useState } from 'react';
import '../styles/SimulationForm.css';

const DEFAULT_FORM_DATA = {
  daily_car_distance: 0,
  car_type: 'sedan',
  daily_bike_distance: 0,
  daily_walk_distance: 0,
  diet_type: 'mixed',
  meals_per_day: 3,
  monthly_electricity_kwh: 300,
  monthly_gas_usage: 0,
  monthly_water_liters: 10000,
};

export const LifestyleInputForm = ({ onSubmit, initialData, draftKey }) => {
  const [formData, setFormData] = useState(initialData || DEFAULT_FORM_DATA);

  useEffect(() => {
    setFormData(initialData || DEFAULT_FORM_DATA);
  }, [initialData]);

  useEffect(() => {
    if (!draftKey) return;
    const stored = localStorage.getItem(`sim_form_draft_${draftKey}`);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        setFormData({ ...DEFAULT_FORM_DATA, ...parsed });
      }
    } catch (_) {
      // Ignore malformed local draft and continue with existing values.
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    localStorage.setItem(`sim_form_draft_${draftKey}`, JSON.stringify(formData));
  }, [draftKey, formData]);

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
    if (draftKey) {
      localStorage.removeItem(`sim_form_draft_${draftKey}`);
    }
  };

  const quickEstimate = useMemo(() => {
    const transport = (formData.daily_car_distance * 0.192 * 365) / 1000;
    const dietFactor =
      formData.diet_type === 'vegan'
        ? 1.0
        : formData.diet_type === 'vegetarian'
          ? 2.0
          : formData.diet_type === 'mixed'
            ? 3.0
            : 5.0;
    const diet = (dietFactor * formData.meals_per_day * 365) / 1000;
    const utilities = (formData.monthly_electricity_kwh * 0.82 * 12) / 1000;

    return {
      transport: Math.max(0, transport),
      diet: Math.max(0, diet),
      utilities: Math.max(0, utilities),
      total: Math.max(0, transport + diet + utilities),
    };
  }, [formData]);

  const resetDefaults = () => {
    setFormData(DEFAULT_FORM_DATA);
    if (draftKey) {
      localStorage.removeItem(`sim_form_draft_${draftKey}`);
    }
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

      <div className="quick-estimate">
        <h4>Live Estimate (rough)</h4>
        <p>
          Transport: <strong>{quickEstimate.transport.toFixed(1)}</strong> tCO2e/yr | Diet:{' '}
          <strong>{quickEstimate.diet.toFixed(1)}</strong> tCO2e/yr | Utilities:{' '}
          <strong>{quickEstimate.utilities.toFixed(1)}</strong> tCO2e/yr
        </p>
        <p className="quick-estimate-total">
          Estimated Total: <strong>{quickEstimate.total.toFixed(1)} tCO2e/year</strong>
        </p>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={resetDefaults}>
          Reset Defaults
        </button>
        <button type="submit" className="btn btn-primary">
          Calculate Impact
        </button>
      </div>
    </form>
  );
};
