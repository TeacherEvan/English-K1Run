import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';
import { LanguageProvider } from './context/language-context';
import './i18n'; // Initialize i18n

// Import only main.css here; ensure all other CSS files are imported within main.css in the correct order.
import "./main.css";

// Defer non-critical initialization until after first paint
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for service worker (non-blocking)
  const initServiceWorker = () => import('./lib/service-worker-registration')
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initServiceWorker)
  } else {
    setTimeout(initServiceWorker, 1000)
  }
}

// Initialize accessibility manager
import { enableSmartFocusVisibility, getAccessibilityManager } from './lib/accessibility-utils';

// Initialize accessibility features
enableSmartFocusVisibility()
getAccessibilityManager() // Initialize the singleton

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ErrorBoundary>
)
