import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { featureAPI, simulationAPI, API_URL } from '../api';
import '../styles/FeatureShowcase.css';

const prettyJson = (value) => JSON.stringify(value, null, 2);

export const FeatureShowcase = () => {
  const [simulations, setSimulations] = useState([]);
  const [simIdA, setSimIdA] = useState('');
  const [simIdB, setSimIdB] = useState('');
  const [searchText, setSearchText] = useState('');
  const [goalName, setGoalName] = useState('Reduce CO2 by 25%');
  const [goalDeadline, setGoalDeadline] = useState('2026-12-31T00:00:00');
  const [goalId, setGoalId] = useState('');
  const [shareToken, setShareToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const selectedA = useMemo(
    () => simulations.find((s) => String(s.id) === String(simIdA)),
    [simulations, simIdA]
  );

  const selectedB = useMemo(
    () => simulations.find((s) => String(s.id) === String(simIdB)),
    [simulations, simIdB]
  );

  const runAction = async (label, action) => {
    try {
      setLoading(true);
      setMessage('');
      const data = await action();
      setResult(data);
      setMessage(label + ' completed successfully.');
    } catch (error) {
      const payload = error?.response?.data || { error: error.message };
      setResult(payload);
      setMessage(label + ' failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSimulations = useCallback(async () => {
    await runAction('Load simulations', async () => {
      const response = await simulationAPI.list();
      const items = Array.isArray(response.data) ? response.data : [];
      setSimulations(items);

      if (items.length > 0) {
        const first = String(items[0].id);
        const second = String(items[1]?.id || items[0].id);
        setSimIdA(first);
        setSimIdB(second);
      }

      return { total: items.length, simulations: items };
    });
  }, []);

  useEffect(() => {
    loadSimulations();
  }, [loadSimulations]);

  const handleExportCsv = async () => {
    if (!simIdA) return;

    try {
      setLoading(true);
      setMessage('');
      const response = await featureAPI.exportCsv(simIdA);
      const fileUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.download = `simulation_${simIdA}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(fileUrl);
      setMessage('CSV exported successfully.');
      setResult({ export: 'csv', simulation_id: simIdA, status: 'downloaded' });
    } catch (error) {
      const payload = error?.response?.data || { error: error.message };
      setResult(payload);
      setMessage('CSV export failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="showcase-page">
      <header className="showcase-hero">
        <div>
          <h1>Feature Showcase</h1>
          <p>Use this page to demo all advanced backend features from one place.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadSimulations} disabled={loading}>
          Refresh Simulations
        </button>
      </header>

      <div className="showcase-grid">
        <article className="showcase-card">
          <h3>Quick Setup</h3>
          <p className="muted">Select simulations to run compare/history/recommendation actions.</p>
          <label>Simulation A</label>
          <select value={simIdA} onChange={(e) => setSimIdA(e.target.value)}>
            <option value="">Select</option>
            {simulations.map((sim) => (
              <option key={sim.id} value={sim.id}>
                {sim.id} - {sim.name}
              </option>
            ))}
          </select>

          <label>Simulation B</label>
          <select value={simIdB} onChange={(e) => setSimIdB(e.target.value)}>
            <option value="">Select</option>
            {simulations.map((sim) => (
              <option key={sim.id} value={sim.id}>
                {sim.id} - {sim.name}
              </option>
            ))}
          </select>

          <p className="muted small">API: {API_URL}</p>
        </article>

        <article className="showcase-card">
          <h3>Simulation Features</h3>
          <div className="button-row">
            <button
              className="btn btn-primary"
              disabled={loading || !simIdA || !simIdB}
              onClick={() => runAction('Compare simulations', async () => (await featureAPI.compare(simIdA, simIdB)).data)}
            >
              Compare A vs B
            </button>
            <button
              className="btn btn-secondary"
              disabled={loading || !simIdA}
              onClick={() => runAction('Simulation history', async () => (await featureAPI.history(simIdA)).data)}
            >
              History
            </button>
            <button
              className="btn btn-secondary"
              disabled={loading || !simIdA}
              onClick={() => runAction('Ranked recommendations', async () => (await featureAPI.recommendationsRanked(simIdA)).data)}
            >
              Ranked Recommendations
            </button>
            <button className="btn btn-secondary" disabled={loading || !simIdA} onClick={handleExportCsv}>
              Export CSV
            </button>
          </div>
          <p className="muted">Selected A: {selectedA ? selectedA.name : 'None'} | Selected B: {selectedB ? selectedB.name : 'None'}</p>
        </article>

        <article className="showcase-card">
          <h3>Search & Filter</h3>
          <label>Search text</label>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Type simulation name..."
          />
          <div className="button-row">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() =>
                runAction('Search simulations', async () => {
                  const response = await featureAPI.search({ search: searchText, sort: 'savings' });
                  return response.data;
                })
              }
            >
              Run Search
            </button>
          </div>
        </article>

        <article className="showcase-card">
          <h3>Goals</h3>
          <label>Goal name</label>
          <input value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          <label>Deadline (ISO format)</label>
          <input value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
          <label>Goal ID for update/delete</label>
          <input value={goalId} onChange={(e) => setGoalId(e.target.value)} placeholder="e.g. 1" />

          <div className="button-row">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() =>
                runAction('Create goal', async () => {
                  const response = await featureAPI.createGoal({
                    name: goalName,
                    description: 'Created from showcase page',
                    target_reduction_percent: 25,
                    target_deadline: goalDeadline,
                    category: 'overall',
                  });
                  const createdId = response.data?.goal?.id;
                  if (createdId) setGoalId(String(createdId));
                  return response.data;
                })
              }
            >
              Create Goal
            </button>
            <button
              className="btn btn-secondary"
              disabled={loading}
              onClick={() => runAction('List goals', async () => (await featureAPI.listGoals()).data)}
            >
              List Goals
            </button>
            <button
              className="btn btn-secondary"
              disabled={loading || !goalId}
              onClick={() =>
                runAction('Update goal', async () =>
                  (await featureAPI.updateGoal(goalId, { current_reduction_percent: 30, is_completed: true })).data
                )
              }
            >
              Mark Goal Complete
            </button>
            <button
              className="btn btn-danger"
              disabled={loading || !goalId}
              onClick={() => runAction('Delete goal', async () => (await featureAPI.deleteGoal(goalId)).data)}
            >
              Delete Goal
            </button>
          </div>
        </article>

        <article className="showcase-card">
          <h3>Badges & Sharing</h3>
          <label>Share token</label>
          <input
            value={shareToken}
            onChange={(e) => setShareToken(e.target.value)}
            placeholder="Token from Generate Share Link"
          />
          <div className="button-row">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() => runAction('Load badges', async () => (await featureAPI.badges()).data)}
            >
              Get Badges
            </button>
            <button
              className="btn btn-secondary"
              disabled={loading || !simIdA}
              onClick={() =>
                runAction('Generate share link', async () => {
                  const response = await featureAPI.generateShareLink(simIdA);
                  const token = response.data?.share_token;
                  if (token) setShareToken(token);
                  return response.data;
                })
              }
            >
              Generate Share Link
            </button>
            <button
              className="btn btn-secondary"
              disabled={loading || !shareToken}
              onClick={() => runAction('View shared simulation', async () => (await featureAPI.viewShared(shareToken)).data)}
            >
              View Shared
            </button>
            <button
              className="btn btn-danger"
              disabled={loading || !simIdA}
              onClick={() => runAction('Disable sharing', async () => (await featureAPI.disableSharing(simIdA)).data)}
            >
              Disable Sharing
            </button>
          </div>
        </article>
      </div>

      {message && <p className="showcase-message">{message}</p>}

      <section className="showcase-output">
        <h3>Latest API Output</h3>
        <pre>{result ? prettyJson(result) : 'Run an action to see the response payload here.'}</pre>
      </section>
    </section>
  );
};
