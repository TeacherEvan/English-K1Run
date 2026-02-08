import React, { useState, useEffect } from 'react';
import { fetchTestRuns } from '../services/api';
import './TestRunsList.css';

function TestRunsList({ onSelectRun }) {
  const [testRuns, setTestRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTestRuns();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTestRuns, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTestRuns = async () => {
    try {
      setError(null);
      const runs = await fetchTestRuns();
      setTestRuns(runs);
    } catch (error) {
      setError('Failed to load test runs. Make sure the server is running.');
      console.error('Failed to load test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading test runs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadTestRuns} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (testRuns.length === 0) {
    return (
      <div className="empty-container">
        <h2>No Test Results Yet</h2>
        <p>Run your Playwright tests to see results here</p>
        <code>npm run test</code>
      </div>
    );
  }

  return (
    <div className="test-runs-list">
      <div className="list-header">
        <h2>Test Execution History</h2>
        <button onClick={loadTestRuns} className="refresh-button">
          🔄 Refresh
        </button>
      </div>
      
      <div className="runs-grid">
        {testRuns.map(run => (
          <div 
            key={run.id} 
            className="run-card"
            onClick={() => onSelectRun(run.filename)}
          >
            <div className="run-header">
              <span className="run-badge">Test Run</span>
              <span className="run-size">{(run.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="run-info">
              <p className="run-date">
                <strong>📅</strong> {run.date}
              </p>
              <p className="run-file">
                <strong>📄</strong> {run.filename}
              </p>
            </div>
            <div className="run-footer">
              <span className="view-details">View Details →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestRunsList;
