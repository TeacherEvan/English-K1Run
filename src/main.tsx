import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';
import { LanguageProvider } from './context/language-context';
import { SettingsProvider } from './context/settings-context';
import './i18n'; // Initialize i18n

// Import only main.css here; ensure all other CSS files are imported within main.css in the correct order.
import "./main.css";

// Handle stale asset preload errors after deployments (Vite)
if (typeof window !== 'undefined') {
  const showBootFallback = (reason?: string) => {
    const overlay = document.getElementById('boot-fallback')
    if (overlay) {
      overlay.classList.add('show')
    }
    if (reason) {
      console.warn('[Boot] Showing fallback overlay:', reason)
    }
  }

  window.addEventListener('vite:preloadError', () => {
    showBootFallback('vite:preloadError')
    window.location.reload()
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason as { message?: string } | string | undefined
    const message = typeof reason === 'string' ? reason : reason?.message || ''
    if (/Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk|imported module/i.test(message)) {
      showBootFallback(message)
    }
  })
}

// Defer non-critical initialization until after first paint
if (typeof window !== 'undefined') {
  // Service worker registration (PWA) - non-blocking
  const initServiceWorker = async () => {
    if (!import.meta.env.PROD) return

    try {
      const { registerSW } = await import('virtual:pwa-register')

      const updateSW = registerSW({
        onNeedRefresh() {
          // Keep this prompt simple for classroom usage
          if (window.confirm('Update available. Reload now?')) {
            updateSW(true)
          }
        },
        onOfflineReady() {
          console.log('[PWA] Ready to work offline')
        },
        onRegisterError(error) {
          console.warn('[PWA] Service worker registration failed:', error)
        },
      })
    } catch (error) {
      console.warn('[PWA] Failed to initialize PWA registration:', error)
    }
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      void initServiceWorker()
    })
  } else {
    setTimeout(() => {
      void initServiceWorker()
    }, 1000)
  }
}

// Initialize accessibility manager
import { enableSmartFocusVisibility, getAccessibilityManager } from './lib/accessibility-utils';

// Initialize accessibility features
enableSmartFocusVisibility()
getAccessibilityManager() // Initialize the singleton

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('[Boot] Root element not found. App cannot mount.')
  } else {
    createRoot(rootElement).render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SettingsProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </SettingsProvider>
      </ErrorBoundary>
    )

  }
} catch (error) {
  console.error('Failed to render app:', error)
  // Fallback render without React 19 features if needed
}