import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import '../styles/SimulationChart.css';

export const EmissionsComparisonChart = ({ current, improved }) => {
  const data = [
    {
      name: 'Current',
      emissions: Math.round(current),
      fill: '#ef4444',
    },
    {
      name: 'Improved',
      emissions: Math.round(improved),
      fill: '#10b981',
    },
  ];

  return (
    <div className="chart-container">
      <h3>Annual CO₂ Emissions Comparison (kg)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="emissions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EmissionsBreakdownChart = ({ transport, diet, utilities }) => {
  const data = [
    { name: 'Transport', value: Math.round(transport), fill: '#f97316' },
    { name: 'Diet', value: Math.round(diet), fill: '#8b5cf6' },
    { name: 'Utilities', value: Math.round(utilities), fill: '#06b6d4' },
  ];

  const total = transport + diet + utilities;

  return (
    <div className="chart-container">
      <h3>Emissions Breakdown (%)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) =>
              `${name}: ${((value / total) * 100).toFixed(1)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SavingsChart = ({ categories, savings }) => {
  const data = categories.map((cat, idx) => ({
    name: cat,
    savings: Math.round(savings[idx] || 0),
  }));

  return (
    <div className="chart-container">
      <h3>Potential Savings by Category (kg CO₂/year)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="savings" fill="#10b981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CostComparisonChart = ({ currentCost, improvedCost }) => {
  const data = [
    {
      name: 'Current Annual Cost',
      cost: Math.round(currentCost),
      fill: '#ef4444',
    },
    {
      name: 'Improved Annual Cost',
      cost: Math.round(improvedCost),
      fill: '#10b981',
    },
  ];

  return (
    <div className="chart-container">
      <h3>Annual Cost Comparison (INR)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="cost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
