import React from 'react';
import './Sidebar.css';

const Sidebar = ({ reports, activeReportId, onSelect }) => {
  // Helper function to format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Simple icon components
  const Zap = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M11.3 2.3a1 1 0 0 0-1.6-.2l-7 8a1 1 0 0 0 .8 1.6H8l-1.3 5.8a1 1 0 0 0 1.6.2l7-8a1 1 0 0 0-.8-1.6H10l1.3-5.8z"/>
    </svg>
  );
  
  const FileClock = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M12 8v4l3 3" />
    </svg>
  );
  
  const CheckCircle = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
    </svg>
  );
  
  const XCircle = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
    </svg>
  );
  
  const AlertTriangle = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  );

  return (
    <div className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Zap />
        </div>
        <div>
          <h1 className="sidebar-title">Playwright</h1>
          <p className="sidebar-subtitle">Reporter Dashboard</p>
        </div>
      </div>

      {/* History List */}
      <div className="sidebar-content">
        <h3 className="sidebar-section-title">Run History</h3>
        {reports.map((report) => {
          const isActive = report.id === activeReportId;
          const stats = report.stats || {};
          const status = (stats.failed || stats.unexpected || 0) > 0 ? 'failed' : 
                        (stats.flaky || 0) > 0 ? 'flaky' : 'passed';
          
          return (
            <button
              key={report.id}
              onClick={() => onSelect(report.id)}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
            >
              {isActive && <div className="sidebar-item-indicator"></div>}
              
              <div className="sidebar-item-header">
                <span className="sidebar-item-title">
                  {report.filename || report.id}
                </span>
                <div className={`sidebar-item-badge sidebar-item-badge-${status}`}>
                  {status === 'passed' && <CheckCircle />}
                  {status === 'failed' && <XCircle />}
                  {status === 'flaky' && <AlertTriangle />}
                </div>
              </div>
              
              <div className="sidebar-item-meta">
                <FileClock />
                <span>{formatDate(report.timestamp || Date.now())}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="sidebar-footer-info">
            <span>Pass Rate</span>
            <span className="sidebar-footer-value">
              {(() => {
                const activeReport = reports.find(r => r.id === activeReportId);
                if (!activeReport || !activeReport.stats) return '0%';
                const passed = activeReport.stats.passed || activeReport.stats.expected || 0;
                const total = activeReport.stats.total || (passed + (activeReport.stats.failed || activeReport.stats.unexpected || 0));
                return total > 0 ? Math.round((passed / total) * 100) + '%' : '0%';
              })()}
            </span>
          </div>
          <div className="sidebar-footer-progress">
            <div 
              className="sidebar-footer-progress-bar"
              style={{ 
                width: (() => {
                  const activeReport = reports.find(r => r.id === activeReportId);
                  if (!activeReport || !activeReport.stats) return '0%';
                  const passed = activeReport.stats.passed || activeReport.stats.expected || 0;
                  const total = activeReport.stats.total || (passed + (activeReport.stats.failed || activeReport.stats.unexpected || 0));
                  return total > 0 ? Math.round((passed / total) * 100) + '%' : '0%';
                })()
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
