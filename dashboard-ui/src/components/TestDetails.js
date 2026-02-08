import React from 'react';
import { formatDuration, stripAnsi, getFileName } from '../utils';
import './TestDetails.css';

const TestDetails = ({ spec }) => {
  const result = spec.tests[0]?.results[spec.tests[0].results.length - 1];
  
  if (!result) {
    return <div className="test-details-empty">No execution data available.</div>;
  }

  const isFailed = result.status !== 'passed' && result.status !== 'skipped';
  
  const allErrors = [
    ...(result.error ? [result.error] : []),
    ...(result.errors || [])
  ];

  // Icons
  const Clock = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const Terminal = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const FileText = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const AlertCircle = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const FileImage = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const Video = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="test-details">
      {/* Meta Grid */}
      <div className="test-meta-grid">
        <div className="test-meta-card test-meta-blue">
          <div className="test-meta-icon">
            <Clock />
          </div>
          <div>
            <p className="test-meta-label">Duration</p>
            <p className="test-meta-value">{formatDuration(result.duration)}</p>
          </div>
        </div>
        <div className="test-meta-card test-meta-purple">
          <div className="test-meta-icon">
            <Terminal />
          </div>
          <div>
            <p className="test-meta-label">Worker</p>
            <p className="test-meta-value">Index {result.workerIndex}</p>
          </div>
        </div>
        <div className="test-meta-card test-meta-slate">
          <div className="test-meta-icon">
            <FileText />
          </div>
          <div>
            <p className="test-meta-label">Project</p>
            <p className="test-meta-value">{spec.tests[0].projectName}</p>
          </div>
        </div>
      </div>

      {/* Errors Section */}
      {isFailed && allErrors.length > 0 && (
        <div className="test-errors">
          <h4 className="test-errors-title">
            <AlertCircle />
            Exception Trace
          </h4>
          <div className="test-errors-list">
            {allErrors.map((error, idx) => (
              <div key={idx} className="test-error-terminal">
                <div className="test-error-header">
                  <div className="test-error-dots">
                    <div className="test-error-dot test-error-dot-red"></div>
                    <div className="test-error-dot test-error-dot-yellow"></div>
                    <div className="test-error-dot test-error-dot-green"></div>
                  </div>
                  {error.location && (
                    <span className="test-error-location">
                      {getFileName(error.location.file)}:{error.location.line}
                    </span>
                  )}
                </div>
                <div className="test-error-body">
                  <pre className="test-error-text">
                    {stripAnsi(error.stack || error.message)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments Section */}
      {result.attachments && result.attachments.length > 0 && (
        <div className="test-attachments">
          <h4 className="test-attachments-title">Artifacts & Attachments</h4>
          <div className="test-attachments-grid">
            {result.attachments.map((att, idx) => {
              const isImage = att.contentType.startsWith('image/');
              const isVideo = att.contentType.startsWith('video/');
              
              return (
                <div key={idx} className="test-attachment-card">
                  <div className="test-attachment-content">
                    <div className={`test-attachment-icon ${
                      isImage ? 'test-attachment-icon-purple' : 
                      isVideo ? 'test-attachment-icon-blue' : 
                      'test-attachment-icon-slate'
                    }`}>
                      {isImage ? <FileImage /> : isVideo ? <Video /> : <FileText />}
                    </div>
                    <div className="test-attachment-info">
                      <p className="test-attachment-name" title={att.name}>
                        {att.name || 'Artifact'}
                      </p>
                      <p className="test-attachment-path">
                        {att.path.split(/[/\\]/).pop()}
                      </p>
                      <div className="test-attachment-badge">
                        {att.contentType}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Steps Section */}
      {result.steps && result.steps.length > 0 && (
        <div className="test-steps">
          <h4 className="test-steps-title">Execution Steps</h4>
          <div className="test-steps-list">
            {result.steps.map((step, idx) => (
              <div key={idx} className="test-step-item">
                <div className="test-step-info">
                  <div className="test-step-dot"></div>
                  <span className="test-step-title">{step.title}</span>
                </div>
                <span className="test-step-duration">{formatDuration(step.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDetails;
