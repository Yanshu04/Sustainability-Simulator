import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ProjectHome.css';

export const ProjectHome = () => {
  const { user } = useAuth();

  return (
    <div className="project-home">
      <section className="project-hero">
        <div className="project-hero-content">
          <p className="project-hero-kicker">Project Overview</p>
          <h1>Sustainability Simulator Workspace</h1>
          <p>
            Welcome back, {user?.username}. This page gives you a complete view of what this project can do
            and where to start next.
          </p>
          <div className="project-home-actions">
            <Link className="btn btn-primary" to="/dashboard">
              Open Dashboard
            </Link>
            <Link className="btn btn-secondary" to="/showcase">
              Open Feature Showcase
            </Link>
          </div>
        </div>
      </section>

      <section className="project-section">
        <h2>What This Project Includes</h2>
        <div className="project-grid three-col">
          <article className="project-card">
            <h3>Simulation Engine</h3>
            <p>Create and compare lifestyle scenarios for transport, diet, and home energy usage.</p>
          </article>
          <article className="project-card">
            <h3>Advanced Analytics</h3>
            <p>Track CO2 impact, cost savings, water savings, and long-term environmental trends.</p>
          </article>
          <article className="project-card">
            <h3>Smart Recommendations</h3>
            <p>Receive personalized and ranked actions that improve impact with practical effort levels.</p>
          </article>
          <article className="project-card">
            <h3>Goals and Milestones</h3>
            <p>Set reduction goals, update progress, and monitor your sustainability journey over time.</p>
          </article>
          <article className="project-card">
            <h3>Progress Tracking</h3>
            <p>Track improvements over time with simulation history and measurable savings.</p>
          </article>
          <article className="project-card">
            <h3>Export and Analysis</h3>
            <p>Export reports in CSV format for external analysis and reporting.</p>
          </article>
        </div>
      </section>

      <section className="project-section">
        <h2>Quick Start Flow</h2>
        <div className="project-grid steps-grid">
          <article className="step-card">
            <span>1</span>
            <h3>Create your first simulation</h3>
            <p>Go to Dashboard and enter your current lifestyle inputs.</p>
          </article>
          <article className="step-card">
            <span>2</span>
            <h3>Test an improved scenario</h3>
            <p>Adjust choices to see how much CO2, water, and cost you can save.</p>
          </article>
          <article className="step-card">
            <span>3</span>
            <h3>Review recommendations</h3>
            <p>Use ranked recommendations to prioritize the highest impact actions.</p>
          </article>
          <article className="step-card">
            <span>4</span>
            <h3>Set goals and track progress</h3>
            <p>Create goals and revisit them regularly to stay on target.</p>
          </article>
        </div>
      </section>

      <section className="project-section">
        <h2>Feature Modules</h2>
        <div className="project-grid two-col">
          <article className="project-card">
            <h3>Dashboard Module</h3>
            <p>Main workspace for creating and editing simulations, viewing charts, and comparing current vs improved results.</p>
          </article>
          <article className="project-card">
            <h3>Feature Showcase Module</h3>
            <p>Interactive panel to run advanced APIs including compare, history, goals, recommendations, and search.</p>
          </article>
        </div>
      </section>
    </div>
  );
};
