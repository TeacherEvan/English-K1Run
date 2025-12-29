import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';

// Import only main.css here; ensure all other CSS files are imported within main.css in the correct order.
import "./main.css";

// Register service worker for PWA capabilities (offline support, caching)
import './lib/service-worker-registration';

// Initialize accessibility manager
import { enableSmartFocusVisibility, getAccessibilityManager } from './lib/accessibility-utils';

// Initialize accessibility features
enableSmartFocusVisibility()
getAccessibilityManager() // Initialize the singleton

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
