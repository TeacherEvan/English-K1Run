// Format milliseconds to readable string (e.g. 1m 30s or 450ms)
export const formatDuration = (ms) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
};

// Format ISO date string
export const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

// Strip ANSI color codes from terminal output
export const stripAnsi = (text) => {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

// Extract filename from path
export const getFileName = (path) => {
  return path.split(/[/\\]/).pop() || path;
};

// Get status color
export const getStatusColor = (status) => {
  switch (status) {
    case 'passed': return '#10b981'; // emerald-500
    case 'failed': return '#ef4444'; // red-500
    case 'timedOut': return '#ef4444'; // red-500
    case 'flaky': return '#f59e0b'; // amber-500
    case 'skipped': return '#94a3b8'; // slate-400
    default: return '#64748b'; // slate-500
  }
};
