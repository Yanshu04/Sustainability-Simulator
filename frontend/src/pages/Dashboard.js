import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { simulationAPI } from '../api';
import { LifestyleInputForm } from '../components/SimulationForm';
import {
  EmissionsComparisonChart,
  CostComparisonChart,
} from '../components/Charts';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState([]);
  const [selectedSim, setSelectedSim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      setLoading(true);
      const response = await simulationAPI.list();
      setSimulations(response.data);
      if (response.data.length > 0) {
        setSelectedSim(response.data[0]);
      }
    } catch (err) {
      setError('Failed to load simulations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSimulation = async (formData) => {
    try {
      setLoading(true);
      const response = await simulationAPI.create({
        name: `Simulation ${new Date().toLocaleDateString()}`,
        description: 'User lifestyle simulation',
        ...formData,
      });
      setSimulations([...simulations, response.data]);
      setSelectedSim(response.data);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSimulation = async (improved) => {
    if (!selectedSim) return;

    try {
      setLoading(true);
      const response = await simulationAPI.update(selectedSim.id, {
        improved: {
          car_distance: improved.daily_car_distance || 0,
          car_type: improved.car_type || 'electric',
          bike_distance: improved.daily_bike_distance || 0,
          walk_distance: improved.daily_walk_distance || 0,
          diet_type: improved.diet_type || 'vegetarian',
          meals_per_day: improved.meals_per_day || 3,
          electricity_kwh: improved.monthly_electricity_kwh || 200,
          gas_usage: improved.monthly_gas_usage || 0,
          water_liters: improved.monthly_water_liters || 7000,
        },
      });
      setSelectedSim(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to update simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSimulation = async (simId) => {
    if (window.confirm('Are you sure you want to delete this simulation?')) {
      try {
        await simulationAPI.delete(simId);
        setSimulations(simulations.filter(s => s.id !== simId));
        setSelectedSim(null);
      } catch (err) {
        setError('Failed to delete simulation');
      }
    }
  };

  if (loading) {
    return <div className="dashboard loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Sustainability Simulator</h1>
        <p>Welcome, {user?.username}! Explore your environmental impact.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="simulations-list">
            <h3>Your Simulations</h3>
            {simulations.length === 0 ? (
              <p className="empty-state">No simulations yet. Create one to get started!</p>
            ) : (
              <ul>
                {simulations.map(sim => (
                  <li
                    key={sim.id}
                    className={selectedSim?.id === sim.id ? 'active' : ''}
                    onClick={() => setSelectedSim(sim)}
                  >
                    <strong>{sim.name}</strong>
                    <small>{new Date(sim.created_at).toLocaleDateString()}</small>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="btn btn-primary btn-block"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Close' : 'New Simulation'}
            </button>
          </div>

          {showForm && (
            <div className="form-container">
              <LifestyleInputForm onSubmit={handleCreateSimulation} />
            </div>
          )}
        </div>

        <div className="main-content">
          {selectedSim ? (
            <>
              <div className="simulation-header">
                <h2>{selectedSim.name}</h2>
                {selectedSim.description && <p>{selectedSim.description}</p>}
              </div>

              {/* Results Cards */}
              <div className="results-cards">
                <div className="result-card">
                  <h4>Current Emissions</h4>
                  <p className="large-number">
                    {Math.round(selectedSim.results.current_annual_emissions)}
                  </p>
                  <p className="unit">kg CO₂/year</p>
                </div>

                <div className="result-card highlight">
                  <h4>Potential Savings</h4>
                  <p className="large-number">
                    {Math.round(selectedSim.results.annual_savings)}
                  </p>
                  <p className="unit">kg CO₂/year</p>
                </div>

                <div className="result-card">
                  <h4>Cost Savings</h4>
                  <p className="large-number">
                    {Math.round(
                      selectedSim.results.current_cost_annual -
                        selectedSim.results.improved_cost_annual
                    )}
                  </p>
                  <p className="unit">INR/year</p>
                </div>

                <div className="result-card">
                  <h4>Water Saved</h4>
                  <p className="large-number">
                    {Math.round(
                      selectedSim.results.current_water_annual -
                        selectedSim.results.improved_water_annual
                    ) / 1000}
                  </p>
                  <p className="unit">1000 liters/year</p>
                </div>
              </div>

              {/* Charts */}
              <div className="charts-section">
                <EmissionsComparisonChart
                  current={selectedSim.results.current_annual_emissions}
                  improved={selectedSim.results.improved_annual_emissions}
                />
                <CostComparisonChart
                  currentCost={selectedSim.results.current_cost_annual}
                  improvedCost={selectedSim.results.improved_cost_annual}
                />
              </div>

              {/* Improved Scenario Form */}
              <div className="improved-scenario">
                <h3>Explore Improved Scenario</h3>
                <LifestyleInputForm
                  initialData={{
                    daily_car_distance: selectedSim.improved.car_distance,
                    car_type: selectedSim.improved.car_type,
                    daily_bike_distance: selectedSim.improved.bike_distance,
                    daily_walk_distance: selectedSim.improved.walk_distance,
                    diet_type: selectedSim.improved.diet_type,
                    meals_per_day: selectedSim.improved.meals_per_day,
                    monthly_electricity_kwh: selectedSim.improved.electricity_kwh,
                    monthly_gas_usage: selectedSim.improved.gas_usage,
                    monthly_water_liters: selectedSim.improved.water_liters,
                  }}
                  onSubmit={handleUpdateSimulation}
                />
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteSimulation(selectedSim.id)}
                >
                  Delete Simulation
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No simulation selected</h2>
              <p>Create a new simulation to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
