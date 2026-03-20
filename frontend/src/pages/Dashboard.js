import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { featureAPI, simulationAPI } from '../api';
import { LifestyleInputForm } from '../components/SimulationForm';
import {
  EmissionsComparisonChart,
  CostComparisonChart,
} from '../components/Charts';
import '../styles/Dashboard.css';

const MAX_RECOMMENDED_ACTIONS = 3;
const DASHBOARD_EVENT_LOG_KEY = 'dashboard_recommendation_events';

const SCENARIO_TEMPLATES = {
  student: {
    name: 'Student Commuter',
    description: 'Lower travel footprint with mixed commute habits',
    daily_car_distance: 4,
    car_type: 'sedan',
    daily_bike_distance: 6,
    daily_walk_distance: 2,
    diet_type: 'mixed',
    meals_per_day: 3,
    monthly_electricity_kwh: 180,
    monthly_gas_usage: 0,
    monthly_water_liters: 6500,
  },
  family: {
    name: 'Family Household',
    description: 'Moderate energy use with practical savings targets',
    daily_car_distance: 18,
    car_type: 'suv',
    daily_bike_distance: 1,
    daily_walk_distance: 1,
    diet_type: 'non-vegetarian',
    meals_per_day: 3,
    monthly_electricity_kwh: 420,
    monthly_gas_usage: 12,
    monthly_water_liters: 14000,
  },
  eco: {
    name: 'Eco Starter',
    description: 'Balanced low-carbon baseline to begin sustainability planning',
    daily_car_distance: 2,
    car_type: 'electric',
    daily_bike_distance: 5,
    daily_walk_distance: 3,
    diet_type: 'vegetarian',
    meals_per_day: 3,
    monthly_electricity_kwh: 220,
    monthly_gas_usage: 4,
    monthly_water_liters: 8000,
  },
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState([]);
  const [selectedSim, setSelectedSim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formPlacement, setFormPlacement] = useState('sidebar');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showImprovedScenario, setShowImprovedScenario] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [applyingRecommendationKey, setApplyingRecommendationKey] = useState('');
  const [appliedRecommendationKeys, setAppliedRecommendationKeys] = useState([]);

  const getRecommendationKey = (recommendation) => {
    const suggestion = (recommendation?.suggestion || '').trim().toLowerCase();
    const impact = (recommendation?.impact || '').trim().toLowerCase();
    return `${suggestion}|${impact}`;
  };

  const trackRecommendationEvent = (eventName, payload = {}) => {
    const event = {
      eventName,
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      simulationId: selectedSim?.id || null,
      ...payload,
    };

    try {
      const existingRaw = localStorage.getItem(DASHBOARD_EVENT_LOG_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const next = Array.isArray(existing) ? [...existing, event].slice(-100) : [event];
      localStorage.setItem(DASHBOARD_EVENT_LOG_KEY, JSON.stringify(next));
    } catch (_) {
      // Ignore storage errors and keep event logging non-blocking.
    }

    // Keep a visible trace for local verification during development.
    console.info('[dashboard-event]', event);
  };

  const markOnboardingSeen = () => {
    if (!user?.id) return;
    localStorage.setItem(`onboarding_seen_${user.id}`, '1');
  };

  // Intentionally run once on mount to bootstrap dashboard data.
  useEffect(() => {
    loadSimulations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Intentionally run once on mount to bootstrap goals.
  useEffect(() => {
    loadGoals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Intentionally tied only to selected simulation changes.
  useEffect(() => {
    if (!selectedSim?.id) {
      setRecommendations([]);
      setAppliedRecommendationKeys([]);
      setApplyingRecommendationKey('');
      return;
    }
    setAppliedRecommendationKeys([]);
    setApplyingRecommendationKey('');
    loadRecommendations(selectedSim.id);
  }, [selectedSim?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.id) return;
    const key = `onboarding_seen_${user.id}`;
    const seen = localStorage.getItem(key);
    setShowOnboarding(!seen);
  }, [user]);

  useEffect(() => {
    if (!showAllRecommendations) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowAllRecommendations(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAllRecommendations]);

  const dashboardSummary = useMemo(() => {
    if (!simulations.length) {
      return {
        total: 0,
        avgEmissions: 0,
        avgSavings: 0,
        bestSavings: 0,
      };
    }

    const total = simulations.length;
    const totalEmissions = simulations.reduce((acc, sim) => acc + (sim?.results?.current_annual_emissions || 0), 0);
    const totalSavings = simulations.reduce((acc, sim) => acc + (sim?.results?.annual_savings || 0), 0);
    const bestSavings = simulations.reduce(
      (best, sim) => Math.max(best, sim?.results?.annual_savings || 0),
      0
    );

    return {
      total,
      avgEmissions: totalEmissions / total,
      avgSavings: totalSavings / total,
      bestSavings,
    };
  }, [simulations]);

  const trendInsights = useMemo(() => {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const thisWeek = simulations.filter((sim) => {
      if (!sim?.created_at) return false;
      const ts = new Date(sim.created_at).getTime();
      return ts >= now - oneWeekMs && ts <= now;
    });

    const lastWeek = simulations.filter((sim) => {
      if (!sim?.created_at) return false;
      const ts = new Date(sim.created_at).getTime();
      return ts >= now - 2 * oneWeekMs && ts < now - oneWeekMs;
    });

    const thisWeekAvg =
      thisWeek.length > 0
        ? thisWeek.reduce((acc, sim) => acc + (sim?.results?.current_annual_emissions || 0), 0) / thisWeek.length
        : 0;
    const lastWeekAvg =
      lastWeek.length > 0
        ? lastWeek.reduce((acc, sim) => acc + (sim?.results?.current_annual_emissions || 0), 0) / lastWeek.length
        : 0;

    const delta = thisWeekAvg - lastWeekAvg;
    const deltaPercent = lastWeekAvg > 0 ? (delta / lastWeekAvg) * 100 : 0;

    return {
      thisWeekAvg,
      lastWeekAvg,
      deltaPercent,
      improving: delta < 0,
    };
  }, [simulations]);

  const goalReminders = useMemo(() => {
    const now = new Date();
    const soonDate = new Date(now);
    soonDate.setDate(soonDate.getDate() + 7);

    const activeGoals = goals.filter((goal) => !goal.is_completed);
    const overdue = activeGoals.filter((goal) => new Date(goal.target_deadline) < now);
    const dueSoon = activeGoals.filter((goal) => {
      const deadline = new Date(goal.target_deadline);
      return deadline >= now && deadline <= soonDate;
    });

    return {
      activeCount: activeGoals.length,
      overdue,
      dueSoon,
    };
  }, [goals]);

  const loadSimulations = async () => {
    try {
      setLoading(true);
      const response = await simulationAPI.list();
      setSimulations(response.data);
      if (response.data.length > 0) {
        markOnboardingSeen();
        setShowOnboarding(false);
        setSelectedSim(response.data[0]);
      }
    } catch (err) {
      setError('Failed to load simulations');
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const response = await featureAPI.listGoals();
      const goalItems = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.goals)
          ? response.data.goals
          : [];
      setGoals(goalItems);
    } catch (_) {
      // Goals are optional for dashboard insights.
    }
  };

  const loadRecommendations = async (simId) => {
    try {
      setInsightsLoading(true);
      const response = await simulationAPI.getRecommendations(simId);
      const recs = Array.isArray(response.data?.recommendations) ? response.data.recommendations : [];
      setRecommendations(recs);
    } catch (_) {
      setRecommendations([]);
    } finally {
      setInsightsLoading(false);
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
      setFormPlacement('sidebar');
      setShowTemplatePicker(false);
      markOnboardingSeen();
      setShowOnboarding(false);
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
      setSimulations((prev) => prev.map((sim) => (sim.id === response.data.id ? response.data : sim)));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to update simulation');
      return false;
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

  const applyRecommendation = async (recommendation, source = 'top3') => {
    if (!selectedSim) return;

    const recommendationKey = getRecommendationKey(recommendation);
    if (!recommendationKey || appliedRecommendationKeys.includes(recommendationKey)) {
      return;
    }

    setApplyingRecommendationKey(recommendationKey);

    trackRecommendationEvent('recommendation_apply_clicked', {
      source,
      suggestion: recommendation?.suggestion || '',
    });

    const improved = {
      daily_car_distance: selectedSim.improved.car_distance,
      car_type: selectedSim.improved.car_type,
      daily_bike_distance: selectedSim.improved.bike_distance,
      daily_walk_distance: selectedSim.improved.walk_distance,
      diet_type: selectedSim.improved.diet_type,
      meals_per_day: selectedSim.improved.meals_per_day,
      monthly_electricity_kwh: selectedSim.improved.electricity_kwh,
      monthly_gas_usage: selectedSim.improved.gas_usage,
      monthly_water_liters: selectedSim.improved.water_liters,
    };

    const suggestion = (recommendation?.suggestion || '').toLowerCase();

    if (suggestion.includes('electric car')) {
      improved.car_type = 'electric';
    }
    if (suggestion.includes('bike')) {
      improved.daily_bike_distance = Math.max(improved.daily_bike_distance + 4, 6);
      improved.daily_car_distance = Math.max(0, improved.daily_car_distance - 4);
    }
    if (suggestion.includes('vegetarian')) {
      improved.diet_type = 'vegetarian';
    }
    if (suggestion.includes('vegan')) {
      improved.diet_type = 'vegan';
    }
    if (suggestion.includes('electricity')) {
      improved.monthly_electricity_kwh = Math.max(80, Math.round(improved.monthly_electricity_kwh * 0.8));
    }
    if (suggestion.includes('solar')) {
      improved.monthly_electricity_kwh = Math.max(60, Math.round(improved.monthly_electricity_kwh * 0.6));
    }
    if (suggestion.includes('water')) {
      improved.monthly_water_liters = Math.max(2500, Math.round(improved.monthly_water_liters * 0.8));
    }

    const updated = await handleUpdateSimulation(improved);
    if (updated) {
      setAppliedRecommendationKeys((prev) =>
        prev.includes(recommendationKey) ? prev : [...prev, recommendationKey]
      );
    }

    setApplyingRecommendationKey('');
  };

  const completeOnboarding = () => {
    markOnboardingSeen();
    setShowOnboarding(false);
  };

  const handleNewSimulationClick = () => {
    if (showForm || showTemplatePicker) {
      setShowForm(false);
      setFormPlacement('sidebar');
      setShowTemplatePicker(false);
      return;
    }

    setFormPlacement('sidebar');
    setShowTemplatePicker(true);
    setShowForm(false);
  };

  const handleStartManualSimulation = () => {
    setFormPlacement('main');
    setShowTemplatePicker(false);
    setShowForm(true);
  };

  const handleStartQuickForm = () => {
    setFormPlacement('main');
    setShowTemplatePicker(false);
    setShowForm(true);
  };

  const handleCreateFromTemplate = async (templateKey) => {
    const template = SCENARIO_TEMPLATES[templateKey];
    if (!template) return;

    await handleCreateSimulation({
      name: template.name,
      description: template.description,
      ...template,
    });
  };

  const isMainCreateFlow = showForm && formPlacement === 'main';

  if (loading) {
    return <div className="dashboard loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-row">
          <h1>Sustainability Simulator</h1>
          {!isMainCreateFlow && selectedSim && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowImprovedScenario((prev) => !prev)}
            >
              {showImprovedScenario ? 'Close Explore Improved Scenario' : 'Open Explore Improved Scenario'}
            </button>
          )}
        </div>
        <p>Welcome, {user?.username}! Explore your environmental impact.</p>
      </div>

      <section className="primary-action-strip" aria-label="Primary action">
        <div>
          <h3>Start Or Update Your Sustainability Plan</h3>
          <p>
            Create a new simulation from template/manual input, or open one from the sidebar to continue improving it.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNewSimulationClick}>
          {showForm || showTemplatePicker ? 'Close New Simulation' : 'Create New Simulation'}
        </button>
      </section>

      <div className="dashboard-summary">
        <div className="summary-card">
          <h4>Total Simulations</h4>
          <p>{dashboardSummary.total}</p>
        </div>
        <div className="summary-card">
          <h4>Average Emissions</h4>
          <p>{Math.round(dashboardSummary.avgEmissions)} kg CO2/year</p>
        </div>
        <div className="summary-card">
          <h4>Average Savings</h4>
          <p>{Math.round(dashboardSummary.avgSavings)} kg CO2/year</p>
        </div>
        <div className="summary-card highlight">
          <h4>Best Savings</h4>
          <p>{Math.round(dashboardSummary.bestSavings)} kg CO2/year</p>
        </div>
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
              onClick={handleNewSimulationClick}
            >
              {showForm || showTemplatePicker ? 'Close' : 'New Simulation'}
            </button>
          </div>

          {showTemplatePicker && (
            <div className="template-picker">
              <h4>Choose How To Start</h4>
              <p>Pick a ready template or calculate manually with your own values.</p>
              <div className="template-picker-actions">
                <button className="btn btn-secondary btn-block" onClick={() => handleCreateFromTemplate('student')}>
                  Student Template
                </button>
                <button className="btn btn-secondary btn-block" onClick={() => handleCreateFromTemplate('family')}>
                  Family Template
                </button>
                <button className="btn btn-secondary btn-block" onClick={() => handleCreateFromTemplate('eco')}>
                  Eco Template
                </button>
                <button className="btn btn-primary btn-block" onClick={handleStartManualSimulation}>
                  Calculate Manually
                </button>
              </div>
            </div>
          )}

          {showForm && formPlacement === 'sidebar' && (
            <div className="form-container">
              <LifestyleInputForm onSubmit={handleCreateSimulation} draftKey={`create_${user?.id || 'guest'}`} />
            </div>
          )}

        </div>

        <div className="main-content">
          {showOnboarding && (
            <div className="onboarding-card">
              <h3>Quick Start</h3>
              <p>Create your first scenario in under one minute. You can use a template or fill the full form.</p>
              <div className="onboarding-actions">
                <button className="btn btn-primary" onClick={handleStartQuickForm}>Start with form</button>
                <button className="btn btn-secondary" onClick={() => handleCreateFromTemplate('eco')}>Use Eco template</button>
                <button className="btn" onClick={completeOnboarding}>Dismiss</button>
              </div>
            </div>
          )}

          {showForm && formPlacement === 'main' && (
            <div className="onboarding-form-container">
              <LifestyleInputForm onSubmit={handleCreateSimulation} draftKey={`create_${user?.id || 'guest'}`} />
            </div>
          )}

          {!isMainCreateFlow && selectedSim ? (
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

              <div className="insights-grid">
                <div className="insight-card">
                  <h3>Weekly Trend</h3>
                  <p>
                    This week avg: <strong>{Math.round(trendInsights.thisWeekAvg)} kg CO2/yr</strong>
                  </p>
                  <p>
                    Last week avg: <strong>{Math.round(trendInsights.lastWeekAvg)} kg CO2/yr</strong>
                  </p>
                  <p className={trendInsights.improving ? 'trend-good' : 'trend-warn'}>
                    {trendInsights.improving ? 'Improving' : 'Needs attention'}:{' '}
                    {Math.abs(trendInsights.deltaPercent).toFixed(1)}%
                  </p>
                </div>

                <div className="insight-card">
                  <h3>Goal Reminders</h3>
                  <p>Active goals: <strong>{goalReminders.activeCount}</strong></p>
                  <p>Due in 7 days: <strong>{goalReminders.dueSoon.length}</strong></p>
                  <p>Overdue: <strong>{goalReminders.overdue.length}</strong></p>
                </div>
              </div>

              <div className="recommendations-panel">
                <div className="recommendations-header">
                  <h3>Recommended Next Actions</h3>
                  <div className="recommendation-actions">
                    {recommendations.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => {
                          trackRecommendationEvent('recommendation_view_all_opened', {
                            totalRecommendations: recommendations.length,
                          });
                          setShowAllRecommendations(true);
                        }}
                      >
                        View all ({recommendations.length})
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      disabled={insightsLoading}
                      onClick={() => loadRecommendations(selectedSim.id)}
                    >
                      {insightsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                {recommendations.length === 0 ? (
                  <p className="muted">No recommendations available for this simulation.</p>
                ) : (
                  <>
                    <p className="muted">
                      Showing top {Math.min(MAX_RECOMMENDED_ACTIONS, recommendations.length)} recommendation cards.
                    </p>
                    <ul className="recommendation-list">
                      {recommendations.slice(0, MAX_RECOMMENDED_ACTIONS).map((rec, index) => (
                        (() => {
                          const recKey = getRecommendationKey(rec);
                          const isApplying = applyingRecommendationKey === recKey;
                          const isApplied = appliedRecommendationKeys.includes(recKey);

                          return (
                            <li key={`${rec.suggestion}-${index}`}>
                              <div>
                                <strong>{rec.suggestion}</strong>
                                <p>{rec.impact}</p>
                              </div>
                              <button
                                className="btn btn-primary btn-small"
                                disabled={isApplying || isApplied}
                                onClick={() => applyRecommendation(rec, 'top3')}
                              >
                                {isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply'}
                              </button>
                            </li>
                          );
                        })()
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {showAllRecommendations && recommendations.length > 0 && (
                <div
                  className="recommendations-modal-backdrop"
                  role="presentation"
                  onClick={() => setShowAllRecommendations(false)}
                >
                  <div
                    className="recommendations-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="All recommended actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="recommendations-modal-header">
                      <h3>All Recommended Actions</h3>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setShowAllRecommendations(false)}
                      >
                        Close
                      </button>
                    </div>
                    <ul className="recommendation-list recommendation-list-full">
                      {recommendations.map((rec, index) => (
                        (() => {
                          const recKey = getRecommendationKey(rec);
                          const isApplying = applyingRecommendationKey === recKey;
                          const isApplied = appliedRecommendationKeys.includes(recKey);

                          return (
                            <li key={`modal-${rec.suggestion}-${index}`}>
                              <div>
                                <strong>{rec.suggestion}</strong>
                                <p>{rec.impact}</p>
                              </div>
                              <button
                                className="btn btn-primary btn-small"
                                disabled={isApplying || isApplied}
                                onClick={() => {
                                  applyRecommendation(rec, 'modal');
                                  setShowAllRecommendations(false);
                                }}
                              >
                                {isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply'}
                              </button>
                            </li>
                          );
                        })()
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Improved Scenario Form */}
              {showImprovedScenario && (
                <div className="improved-scenario">
                  <h3>Explore Improved Scenario</h3>
                  <LifestyleInputForm
                    draftKey={`improved_${selectedSim.id}`}
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
              )}

              <div className="action-buttons">
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteSimulation(selectedSim.id)}
                >
                  Delete Simulation
                </button>
              </div>
            </>
          ) : !isMainCreateFlow ? (
            <div className="empty-state">
              <h2>No simulation selected</h2>
              <p>Select one from the sidebar, or create a new simulation to continue.</p>
              <div className="template-grid">
                <button className="btn btn-secondary" onClick={() => handleCreateFromTemplate('student')}>
                  Use Student Template
                </button>
                <button className="btn btn-secondary" onClick={() => handleCreateFromTemplate('family')}>
                  Use Family Template
                </button>
                <button className="btn btn-secondary" onClick={() => handleCreateFromTemplate('eco')}>
                  Use Eco Template
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
