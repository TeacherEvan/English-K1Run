import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import Sidebar from './components/Sidebar';
import SuiteList from './components/SuiteList';
import { formatDuration, formatDate } from './utils';
import { fetchTestRuns, fetchTestRunDetails } from './services/api';
import './App.css';

const COLORS = {
  passed: '#10b981',
  failed: '#ef4444',
  skipped: '#94a3b8',
  flaky: '#f59e0b',
};

function App() {
  const [testRuns, setTestRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Icons
  const CheckCircle2 = ({ className, style }) => (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
    </svg>
  );

  const XCircle = ({ className, style }) => (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
    </svg>
  );

  const AlertTriangle = ({ className, style }) => (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  );

  const Clock = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const Timer = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const Layers = ({ className, style }) => (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const Search = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  // Load test runs on mount
  useEffect(() => {
    loadTestRuns();
  }, []);

  // Load run details when selection changes
  useEffect(() => {
    if (selectedRunId) {
      loadRunDetails(selectedRunId);
    }
  }, [selectedRunId]);

  const loadTestRuns = async () => {
    try {
      const runs = await fetchTestRuns();
      const runsWithStats = runs.map(run => ({
        ...run,
        stats: { passed: 0, failed: 0, total: 0, expected: 0, unexpected: 0, flaky: 0, skipped: 0 }
      }));
      setTestRuns(runsWithStats);
      if (runsWithStats.length > 0 && !selectedRunId) {
        setSelectedRunId(runsWithStats[0].filename);
      }
    } catch (error) {
      console.error('Failed to load test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetails = async (runId) => {
    try {
      const details = await fetchTestRunDetails(runId);
      setSelectedReport(details);
      
      setTestRuns(prev => prev.map(run => 
        run.filename === runId ? { ...run, stats: details.stats } : run
      ));
    } catch (error) {
      console.error('Failed to load run details:', error);
    }
  };

  // HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const report = selectedReport;

  // Chart Data - Duration Insights (Top 5 Slowest)
  const allTests = useMemo(() => {
    if (!report || !report.suites) return [];
    return report.suites.flatMap(suite => suite.specs.flatMap(spec => {
      const result = spec.tests[0]?.results[spec.tests[0].results.length - 1];
      return {
        name: spec.title,
        duration: result?.duration || 0,
        status: result?.status || 'skipped',
        startTime: result?.startTime
      };
    }));
  }, [report]);

  const slowestTests = useMemo(() => {
    return [...allTests]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(t => ({
        ...t,
        durationSeconds: parseFloat((t.duration / 1000).toFixed(2)),
        displayName: t.name.length > 25 ? t.name.substring(0, 25) + '...' : t.name
      }));
  }, [allTests]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <p className="loading-text">No test results available</p>
        </div>
      </div>
    );
  }

  // Stats calculation
  const totalTests = report.stats.expected + report.stats.unexpected + report.stats.skipped + report.stats.flaky;
  const passRate = totalTests > 0 ? ((report.stats.expected / totalTests) * 100).toFixed(0) : 0;

  // Chart Data - Status Distribution
  const statusData = [
    { name: 'Passed', value: report.stats.expected, color: COLORS.passed },
    { name: 'Failed', value: report.stats.unexpected, color: COLORS.failed },
    { name: 'Flaky', value: report.stats.flaky, color: COLORS.flaky },
    { name: 'Skipped', value: report.stats.skipped, color: COLORS.skipped },
  ].filter(d => d.value > 0);

  const StatCard = ({ title, value, color, icon: Icon, subtext, delay }) => (
    <div 
      className="stat-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <p className="stat-card-title">{title}</p>
        <p className="stat-card-value" style={{ color }}>{value}</p>
        {subtext && <p className="stat-card-subtext">{subtext}</p>}
      </div>
      <div className="stat-card-icon" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color: color }} />
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <Sidebar 
        reports={testRuns}
        activeReportId={selectedRunId}
        onSelect={setSelectedRunId}
      />

      <div className="main-content">
        <div className="main-background"></div>

        <div className="main-scroll">
          <div className="main-inner">
            {/* Header Section */}
            <div className="header-section">
              <div>
                <h2 className="header-title">Execution Report</h2>
                <div className="header-meta">
                  <span className="header-meta-item">
                    <Clock className="w-4 h-4 header-meta-icon-blue" />
                    {formatDate(report.stats.startTime)}
                  </span>
                  <span className="header-meta-item">
                    <Timer className="w-4 h-4 header-meta-icon-purple" />
                    {formatDuration(report.stats.duration)}
                  </span>
                </div>
              </div>
              <div className="header-project">
                <div className="header-project-card">
                  <span className="header-project-label">Project</span>
                  <span className="header-project-value">{report.config.projects[0].name}</span>
                </div>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="kpi-grid">
              <StatCard 
                title="Total Tests" 
                value={totalTests} 
                color="#475569" 
                icon={Layers} 
                subtext={`${report.suites.length} Suites Executed`}
                delay={0}
              />
              <StatCard 
                title="Passed" 
                value={report.stats.expected} 
                color={COLORS.passed} 
                icon={CheckCircle2} 
                subtext={`${passRate}% Success Rate`}
                delay={100}
              />
              <StatCard 
                title="Failed" 
                value={report.stats.unexpected} 
                color={COLORS.failed} 
                icon={XCircle} 
                subtext={report.stats.unexpected > 0 ? "Action Required" : "All Clean"}
                delay={200}
              />
              <StatCard 
                title="Flaky" 
                value={report.stats.flaky} 
                color={COLORS.flaky} 
                icon={AlertTriangle} 
                subtext="Potential Instability"
                delay={300}
              />
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              {/* Status Chart */}
              <div className="chart-card chart-card-single">
                <h3 className="chart-title">
                  <div className="chart-title-indicator"></div>
                  Status Distribution
                </h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-center-label">
                    <span className="chart-center-value">{totalTests}</span>
                    <span className="chart-center-text">Total</span>
                  </div>
                </div>
              </div>

              {/* Slowest Tests Chart */}
              <div className="chart-card chart-card-double">
                <h3 className="chart-title">
                  <div className="chart-title-indicator chart-title-indicator-amber"></div>
                  Duration Insights <span className="chart-title-subtitle">(Top 5 Slowest)</span>
                </h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={slowestTests}
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      barSize={24}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="displayName" 
                        type="category" 
                        width={150} 
                        tick={{ fontSize: 11, fill: '#64748b' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="chart-tooltip">
                                <p className="chart-tooltip-title">{data.name}</p>
                                <p className="chart-tooltip-text">Duration: <span className="chart-tooltip-value">{formatDuration(data.duration)}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="durationSeconds" radius={[0, 4, 4, 0]}>
                        {slowestTests.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.status === 'failed' ? '#f87171' : '#60a5fa'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="filter-bar">
              <div className="filter-buttons">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={`filter-button ${activeFilter === 'all' ? 'filter-button-active' : ''}`}
                >
                  All Tests
                </button>
                <button 
                  onClick={() => setActiveFilter('passed')}
                  className={`filter-button filter-button-passed ${activeFilter === 'passed' ? 'filter-button-passed-active' : ''}`}
                >
                  Passed <span className="filter-badge filter-badge-passed">{report.stats.expected}</span>
                </button>
                <button 
                  onClick={() => setActiveFilter('failed')}
                  className={`filter-button filter-button-failed ${activeFilter === 'failed' ? 'filter-button-failed-active' : ''}`}
                >
                  Failed <span className="filter-badge filter-badge-failed">{report.stats.unexpected}</span>
                </button>
                <button 
                  onClick={() => setActiveFilter('flaky')}
                  className={`filter-button filter-button-flaky ${activeFilter === 'flaky' ? 'filter-button-flaky-active' : ''}`}
                >
                  Flaky <span className="filter-badge filter-badge-flaky">{report.stats.flaky}</span>
                </button>
              </div>

              <div className="search-container">
                <div className="search-icon">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search suites or test cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Test Suites List */}
            <SuiteList 
              suites={report.suites} 
              filter={activeFilter}
              searchTerm={searchTerm}
            />

            {/* Footer */}
            <div className="footer">
              <p className="footer-text">
                Generated with <span className="footer-version">v{report.config.version}</span> • {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
