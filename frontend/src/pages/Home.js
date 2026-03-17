import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>What-If Sustainability Simulator</h1>
          <p className="subtitle">
            Discover how your daily choices impact the environment
          </p>
          <p className="description">
            Interactive system to simulate lifestyle changes and understand their environmental impact
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Log In
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Key Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">01</div>
            <h3>Impact Analysis</h3>
            <p>Quantify your environmental impact across transport, diet, and energy usage</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">02</div>
            <h3>Scenario Simulation</h3>
            <p>Explore "what-if" scenarios and see potential savings in real-time</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">03</div>
            <h3>Visual Insights</h3>
            <p>Beautiful charts and graphs showing before-and-after comparisons</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">04</div>
            <h3>Smart Recommendations</h3>
            <p>Get personalized suggestions to reduce your environmental footprint</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">05</div>
            <h3>Cost Savings</h3>
            <p>See how sustainable choices can save you money annually</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">06</div>
            <h3>Easy to Use</h3>
            <p>Intuitive interface that makes sustainability accessible to everyone</p>
          </div>
        </div>
      </section>

      <section className="impact-metrics">
        <h2>Environmental Impact Metrics</h2>
        <div className="metrics-grid">
          <div className="metric">
            <h4>Transport Emissions</h4>
            <p>Track CO₂ from cars, bikes, and walking</p>
          </div>
          <div className="metric">
            <h4>Dietary Impact</h4>
            <p>Monitor food choices from vegetarian to non-vegetarian</p>
          </div>
          <div className="metric">
            <h4>Energy Usage</h4>
            <p>Assess electricity, gas, and water consumption</p>
          </div>
          <div className="metric">
            <h4>Annual Totals</h4>
            <p>See yearly emissions, water use, and cost savings</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Input Your Lifestyle</h4>
            <p>Tell us about your daily transportation, diet, and energy usage</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Calculate Impact</h4>
            <p>We compute your environmental footprint using scientific emission factors</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Explore Scenarios</h4>
            <p>Try different lifestyle changes and see the impact instantly</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Get Insights</h4>
            <p>Receive personalized recommendations for sustainable living</p>
          </div>
        </div>
      </section>
    </div>
  );
};
