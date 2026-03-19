import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { featureAPI, simulationAPI, API_URL } from '../api';
import '../styles/FeatureShowcase.css';

const prettyJson = (value) => JSON.stringify(value, null, 2);

const buildDefaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 19);
};

export const FeatureShowcase = () => {
  const [simulations, setSimulations] = useState([]);
  const [goals, setGoals] = useState([]);
  const [simIdA, setSimIdA] = useState('');
  const [simIdB, setSimIdB] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchSort, setSearchSort] = useState('savings');
  const [goalName, setGoalName] = useState('Reduce household emissions by 20%');
  const [goalDeadline, setGoalDeadline] = useState(buildDefaultDeadline());
  const [goalId, setGoalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthRunning, setHealthRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [operationLog, setOperationLog] = useState([]);

  const selectedA = useMemo(
    () => simulations.find((s) => String(s.id) === String(simIdA)),
    [simulations, simIdA]
  );

  const selectedB = useMemo(
    () => simulations.find((s) => String(s.id) === String(simIdB)),
    [simulations, simIdB]
  );

  const addOperation = useCallback((label, status, details) => {
    setOperationLog((prev) => [{ label, status, timestamp: new Date().toISOString(), details }, ...prev].slice(0, 4));
  }, []);

  const runAction = useCallback(
    async (label, action, opts = {}) => {
      const keepSpinner = !!opts.keepSpinner;
      try {
        if (!keepSpinner) {
          setLoading(true);
        }
        setMessage('');
        const data = await action();
        setResult(data);
        setMessage(label + ' completed successfully.');
        addOperation(label, 'success', 'Completed');
        return data;
      } catch (error) {
        const payload = error?.response?.data || { error: error.message };
        setResult(payload);
        setMessage(label + ' failed.');
        addOperation(label, 'failed', payload?.error || 'Request failed');
        throw error;
      } finally {
        if (!keepSpinner) {
          setLoading(false);
        }
      }
    },
    [addOperation]
  );

  const loadSimulations = useCallback(async () => {
    const response = await simulationAPI.list();
    const items = Array.isArray(response.data) ? response.data : [];
    setSimulations(items);

    if (items.length > 0) {
      const first = String(items[0].id);
      const second = String(items[1]?.id || items[0].id);
      setSimIdA((prev) => prev || first);
      setSimIdB((prev) => prev || second);
    }

    return { total: items.length, simulations: items };
  }, []);

  const loadGoals = useCallback(async () => {
    const response = await featureAPI.listGoals();
    const data = Array.isArray(response.data?.goals) ? response.data.goals : [];
    setGoals(data);
    return { total: data.length, goals: data };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      await runAction('Load simulations', loadSimulations);
      await runAction('Load goals', loadGoals);
    };
    bootstrap();
  }, [loadGoals, loadSimulations, runAction]);

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
      const sizeBytes = response.data?.size || 0;
      setMessage('CSV exported successfully.');
      setResult({ export: 'csv', simulation_id: simIdA, status: 'downloaded', size_bytes: sizeBytes });
      addOperation('Export CSV', 'success', `Downloaded ${sizeBytes} bytes`);
    } catch (error) {
      const payload = error?.response?.data || { error: error.message };
      setResult(payload);
      setMessage('CSV export failed.');
      addOperation('Export CSV', 'failed', payload?.error || 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setHealthRunning(true);
    setMessage('Running feature health checks...');

    const checks = [];
    const runCheck = async (name, fn) => {
      try {
        await fn();
        checks.push({ name, status: 'PASS' });
      } catch (err) {
        checks.push({ name, status: 'FAIL', error: err?.response?.data?.error || err?.message || 'Unknown error' });
      }
    };

    try {
      await runCheck('List simulations', async () => {
        await loadSimulations();
      });

      if (simIdA) {
        await runCheck('Simulation history', async () => {
          await featureAPI.history(simIdA);
        });

        await runCheck('Ranked recommendations', async () => {
          await featureAPI.recommendationsRanked(simIdA);
        });

        await runCheck('Export CSV', async () => {
          await featureAPI.exportCsv(simIdA);
        });
      }

      if (simIdA && simIdB) {
        await runCheck('Compare simulations', async () => {
          await featureAPI.compare(simIdA, simIdB);
        });
      }

      await runCheck('Search simulations', async () => {
        await featureAPI.search({ search: searchText, sort: searchSort });
      });

      await runCheck('List goals', async () => {
        await loadGoals();
      });

      const passed = checks.filter((c) => c.status === 'PASS').length;
      const failed = checks.length - passed;
      setResult({
        summary: { total_checks: checks.length, passed, failed },
        checks,
      });
      setMessage(failed === 0 ? 'All feature checks passed.' : `${failed} checks failed.`);
      addOperation('Run all feature checks', failed === 0 ? 'success' : 'failed', `${passed}/${checks.length} passed`);
    } finally {
      setHealthRunning(false);
    }
  };

  return (
    <section className="showcase-page">
      <header className="showcase-hero">
        <div>
          <p className="showcase-kicker">Advanced Feature Lab</p>
          <h1>Feature Showcase</h1>
          <p>Interactive control center to validate every active product feature in one page.</p>
          <p className="muted small">API: {API_URL}</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-secondary" onClick={() => runAction('Load simulations', loadSimulations)} disabled={loading || healthRunning}>
            Refresh Simulations
          </button>
          <button className="btn btn-secondary" onClick={() => runAction('Load goals', loadGoals)} disabled={loading || healthRunning}>
            Refresh Goals
          </button>
          <button className="btn btn-primary" onClick={runHealthCheck} disabled={loading || healthRunning}>
            {healthRunning ? 'Running Checks...' : 'Run All Checks'}
          </button>
        </div>
      </header>

      <div className="showcase-metrics">
        <div className="metric-card">
          <h4>Simulations Loaded</h4>
          <p>{simulations.length}</p>
        </div>
        <div className="metric-card">
          <h4>Goals Loaded</h4>
          <p>{goals.length}</p>
        </div>
        <div className="metric-card">
          <h4>Selected Pair</h4>
          <p>{selectedA?.name || 'None'} vs {selectedB?.name || 'None'}</p>
        </div>
      </div>

      <div className="showcase-grid">
        <article className="showcase-card">
          <h3>Simulation Context</h3>
          <p className="muted">Pick simulations used by compare, history, recommendation, and export tools.</p>
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
              View History
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
        </article>

        <article className="showcase-card">
          <h3>Search and Filter</h3>
          <p className="muted">Search by name/description and sort to validate discoverability behavior.</p>
          <label>Search text</label>
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Type simulation name..." />
          <label>Sort by</label>
          <select value={searchSort} onChange={(e) => setSearchSort(e.target.value)}>
            <option value="created_at">Newest</option>
            <option value="emissions">Highest emissions</option>
            <option value="savings">Highest savings</option>
          </select>
          <div className="button-row">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() =>
                runAction('Search simulations', async () => {
                  const response = await featureAPI.search({ search: searchText, sort: searchSort });
                  return response.data;
                })
              }
            >
              Run Search
            </button>
          </div>
        </article>

        <article className="showcase-card">
          <h3>Goal Management</h3>
          <p className="muted">Create, list, update, and delete goals while tracking the selected goal id.</p>
          <label>Goal name</label>
          <input value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          <label>Deadline (ISO format)</label>
          <input value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} placeholder="YYYY-MM-DDTHH:mm:ss" />
          <label>Goal id for update/delete</label>
          <input value={goalId} onChange={(e) => setGoalId(e.target.value)} placeholder="e.g. 5" />

          <div className="button-row">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() =>
                runAction('Create goal', async () => {
                  const response = await featureAPI.createGoal({
                    name: goalName,
                    description: 'Created from feature showcase',
                    target_reduction_percent: 20,
                    target_deadline: goalDeadline,
                    category: 'overall',
                  });
                  const createdId = response.data?.goal?.id;
                  if (createdId) {
                    setGoalId(String(createdId));
                  }
                  await loadGoals();
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
                runAction('Update goal', async () => {
                  const response = await featureAPI.updateGoal(goalId, {
                    current_reduction_percent: 35,
                    is_completed: true,
                  });
                  await loadGoals();
                  return response.data;
                })
              }
            >
              Mark Complete
            </button>
            <button
              className="btn btn-danger"
              disabled={loading || !goalId}
              onClick={() =>
                runAction('Delete goal', async () => {
                  const response = await featureAPI.deleteGoal(goalId);
                  await loadGoals();
                  return response.data;
                })
              }
            >
              Delete Goal
            </button>
          </div>
        </article>

        <article className="showcase-card">
          <h3>Operation Log</h3>
          <p className="muted">Most recent actions and status for quick troubleshooting.</p>
          {operationLog.length === 0 ? (
            <p className="muted">No operations yet.</p>
          ) : (
            <ul className="operation-log">
              {operationLog.map((entry, idx) => (
                <li key={`${entry.timestamp}-${idx}`}>
                  <span className={`status-pill ${entry.status === 'success' ? 'ok' : 'fail'}`}>{entry.status}</span>
                  <div>
                    <strong>{entry.label}</strong>
                    <p>{entry.details}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      {message && <p className="showcase-message">{message}</p>}

      <section className="showcase-output">
        <h3>Latest API Output</h3>
        <pre>{result ? prettyJson(result) : 'Run an action to inspect API payloads here.'}</pre>
      </section>
    </section>
  );
};
