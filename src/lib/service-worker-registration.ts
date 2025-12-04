/**
 * Service Worker Registration Utility
 * 
 * Handles progressive web app (PWA) capabilities by registering the service worker.
 * Implements best practices for registration, updates, and error handling.
 * 
 * Features:
 * - Automatic service worker registration on page load
 * - Update notifications for new versions
 * - Error handling and fallback strategies
 * - Development mode detection
 * 
 * @module service-worker-registration
 */

/**
 * Configuration options for service worker registration
 */
interface ServiceWorkerConfig {
  /** Callback when service worker updates are found */
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  /** Callback when service worker is successfully registered */
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  /** Callback when registration fails */
  onError?: (error: Error) => void
}

/**
 * Checks if the current environment supports service workers
 * 
 * @returns True if service workers are supported
 */
const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
}

/**
 * Registers the service worker with configured callbacks
 * 
 * @param config - Configuration options for callbacks
 * 
 * @example
 * ```typescript
 * registerServiceWorker({
 *   onUpdate: (registration) => {
 *     console.log('New version available! Please refresh.')
 *   },
 *   onSuccess: (registration) => {
 *     console.log('Service worker registered successfully')
 *   },
 *   onError: (error) => {
 *     console.error('Service worker registration failed:', error)
 *   }
 * })
 * ```
 */
export const registerServiceWorker = (config: ServiceWorkerConfig = {}): void => {
  // Only register in production and if supported
  if (import.meta.env.DEV) {
    console.log('[SW] Service worker registration skipped in development mode')
    return
  }

  if (!isServiceWorkerSupported()) {
    console.warn('[SW] Service workers are not supported in this browser')
    return
  }

  // Wait for page load to avoid competing with initial page rendering
  window.addEventListener('load', () => {
    const swUrl = '/sw.js'

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[SW] Service worker registered successfully:', registration.scope)

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Check every hour

        // Handle service worker updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          
          if (!installingWorker) {
            return
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker available
                console.log('[SW] New version available! Please refresh to update.')
                
                if (config.onUpdate) {
                  config.onUpdate(registration)
                }
              } else {
                // First installation
                console.log('[SW] Content cached for offline use.')
                
                if (config.onSuccess) {
                  config.onSuccess(registration)
                }
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error('[SW] Service worker registration failed:', error)
        
        if (config.onError) {
          config.onError(error)
        }
      })
  })

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
      console.log('[SW] Update available notification received')
    }
  })
}

/**
 * Unregisters all service workers
 * Useful for debugging or emergency rollback
 * 
 * @returns Promise that resolves when all workers are unregistered
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    
    await Promise.all(
      registrations.map((registration) => {
        console.log('[SW] Unregistering service worker')
        return registration.unregister()
      })
    )
    
    console.log('[SW] All service workers unregistered')
  } catch (error) {
    console.error('[SW] Failed to unregister service workers:', error)
  }
}

/**
 * Checks if a new service worker is waiting to activate
 * 
 * @returns Promise resolving to true if update is waiting
 */
export const isUpdateWaiting = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    return !!(registration?.waiting)
  } catch (error) {
    console.error('[SW] Failed to check for updates:', error)
    return false
  }
}

/**
 * Activates waiting service worker immediately
 * Forces the new version to take control without page refresh
 * 
 * @returns Promise that resolves when activation completes
 */
export const activateWaitingServiceWorker = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    if (registration?.waiting) {
      console.log('[SW] Activating waiting service worker')
      
      // Send message to service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload page when new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] New service worker activated, reloading page')
        window.location.reload()
      })
    }
  } catch (error) {
    console.error('[SW] Failed to activate waiting service worker:', error)
  }
}

/**
 * Clears all service worker caches
 * Useful for debugging or forcing fresh content
 * 
 * @returns Promise that resolves when caches are cleared
 */
export const clearServiceWorkerCaches = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    if (registration?.active) {
      console.log('[SW] Requesting cache clear')
      registration.active.postMessage({ type: 'CLEAR_CACHE' })
    }
    
    // Also clear caches directly
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))
    
    console.log('[SW] All caches cleared')
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error)
  }
}

// Auto-register service worker on import (can be disabled if manual control needed)
if (!import.meta.env.DEV) {
  registerServiceWorker({
    onSuccess: () => {
      console.log('[SW] Offline capability enabled')
    },
    onUpdate: () => {
      console.log('[SW] New version detected - refresh to update')
    },
    onError: (error) => {
      console.error('[SW] Registration error:', error)
    }
  })
}
