/**
 * Accessibility Utilities - Production-grade A11y helpers
 * 
 * Provides keyboard navigation, focus management, and ARIA support
 * following WCAG 2.1 AA guidelines and 2025 best practices.
 * 
 * @module accessibility-utils
 * 
 * Features:
 * - Keyboard event handling with semantic key names
 * - Focus trap management for modals/dialogs
 * - Screen reader announcements
 * - Reduced motion detection
 * - Focus visible indicators
 * 
 * @see {@link https://www.w3.org/WAI/WCAG21/quickref/}
 * @see {@link https://web.dev/accessibility/}
 */

/**
 * Keyboard key names for semantic event handling
 * Provides clear, readable alternatives to magic strings
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

/**
 * ARIA live region politeness levels
 */
export type AriaLivePoliteness = 'off' | 'polite' | 'assertive'

/**
 * Check if a keyboard event matches a specific key
 * Provides case-insensitive matching and handles legacy key codes
 * 
 * @param event - Keyboard event to check
 * @param targetKey - Key to match against (from KeyboardKeys)
 * @returns true if the event matches the target key
 * 
 * @example
 * ```typescript
 * const handleKeyDown = (e: KeyboardEvent) => {
 *   if (isKeyPressed(e, KeyboardKeys.ENTER)) {
 *     submitForm()
 *   }
 * }
 * ```
 */
export const isKeyPressed = (
  event: KeyboardEvent | React.KeyboardEvent,
  targetKey: string
): boolean => {
  return event.key === targetKey || event.key.toLowerCase() === targetKey.toLowerCase()
}

/**
 * Check if multiple modifier keys are pressed
 * Useful for keyboard shortcuts and combinations
 * 
 * @param event - Keyboard event to check
 * @param modifiers - Object specifying which modifiers to check
 * @returns true if all specified modifiers match
 * 
 * @example
 * ```typescript
 * // Check for Ctrl+S (or Cmd+S on Mac)
 * if (areModifiersPressed(event, { ctrl: true }) && isKeyPressed(event, 's')) {
 *   saveDocument()
 * }
 * ```
 */
export const areModifiersPressed = (
  event: KeyboardEvent | React.KeyboardEvent,
  modifiers: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  }
): boolean => {
  const checks: boolean[] = []
  
  if (modifiers.ctrl !== undefined) {
    checks.push(event.ctrlKey === modifiers.ctrl)
  }
  if (modifiers.alt !== undefined) {
    checks.push(event.altKey === modifiers.alt)
  }
  if (modifiers.shift !== undefined) {
    checks.push(event.shiftKey === modifiers.shift)
  }
  if (modifiers.meta !== undefined) {
    checks.push(event.metaKey === modifiers.meta)
  }
  
  return checks.every(check => check)
}

/**
 * Focus trap manager for modals and dialogs
 * Prevents focus from leaving a container element
 * 
 * @param containerElement - Element to trap focus within
 * @returns Cleanup function to remove trap
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   if (isModalOpen) {
 *     const cleanup = createFocusTrap(modalRef.current!)
 *     return cleanup
 *   }
 * }, [isModalOpen])
 * ```
 */
export const createFocusTrap = (containerElement: HTMLElement): (() => void) => {
  const focusableElementsSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  const getFocusableElements = (): HTMLElement[] => {
    return Array.from(
      containerElement.querySelectorAll<HTMLElement>(focusableElementsSelector)
    )
  }
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isKeyPressed(event, KeyboardKeys.TAB)) return
    
    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    // Shift+Tab on first element: focus last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
    // Tab on last element: focus first
    else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
  
  // Focus first element on trap creation
  const focusableElements = getFocusableElements()
  if (focusableElements.length > 0) {
    focusableElements[0].focus()
  }
  
  containerElement.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Announce a message to screen readers using ARIA live region
 * Creates a temporary live region that auto-removes after announcement
 * 
 * @param message - Message to announce
 * @param politeness - Urgency level (default: 'polite')
 * @param timeoutMs - Time before removing region (default: 1000ms)
 * 
 * @example
 * ```typescript
 * // Announce success message
 * announceToScreenReader('Form submitted successfully', 'polite')
 * 
 * // Announce urgent error
 * announceToScreenReader('Error: Payment failed', 'assertive')
 * ```
 */
export const announceToScreenReader = (
  message: string,
  politeness: AriaLivePoliteness = 'polite',
  timeoutMs = 1000
): void => {
  // Create temporary live region
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('role', 'status')
  liveRegion.setAttribute('aria-live', politeness)
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.className = 'sr-only' // Visually hidden but accessible
  liveRegion.textContent = message
  
  // Add to DOM
  document.body.appendChild(liveRegion)
  
  // Remove after timeout
  setTimeout(() => {
    document.body.removeChild(liveRegion)
  }, timeoutMs)
}

/**
 * Check if user prefers reduced motion
 * Respects accessibility preferences for animations
 * 
 * @returns true if user prefers reduced motion
 * 
 * @example
 * ```typescript
 * const shouldAnimate = !userPrefersReducedMotion()
 * 
 * if (shouldAnimate) {
 *   element.classList.add('animate-bounce')
 * }
 * ```
 */
export const userPrefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if user prefers reduced data usage
 * Useful for optimizing resource loading
 * 
 * @returns true if user prefers reduced data
 * 
 * @example
 * ```typescript
 * if (!userPrefersReducedData()) {
 *   preloadHighResolutionImages()
 * }
 * ```
 */
export const userPrefersReducedData = (): boolean => {
  return window.matchMedia('(prefers-reduced-data: reduce)').matches
}

/**
 * Check if user prefers dark color scheme
 * Respects system-level color scheme preference
 * 
 * @returns true if user prefers dark mode
 * 
 * @example
 * ```typescript
 * const theme = userPrefersDarkMode() ? 'dark' : 'light'
 * applyTheme(theme)
 * ```
 */
export const userPrefersDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Check if user prefers high contrast
 * Important for accessibility compliance
 * 
 * @returns true if user prefers high contrast
 * 
 * @example
 * ```typescript
 * if (userPrefersHighContrast()) {
 *   applyHighContrastStyles()
 * }
 * ```
 */
export const userPrefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Get all focusable elements within a container
 * Useful for custom keyboard navigation
 * 
 * @param container - Container element to search within
 * @returns Array of focusable elements
 * 
 * @example
 * ```typescript
 * const focusableElements = getAllFocusableElements(menuElement)
 * const firstItem = focusableElements[0]
 * firstItem?.focus()
 * ```
 */
export const getAllFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details',
    'summary',
  ].join(', ')
  
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
}

/**
 * Move focus to the next/previous focusable element
 * Implements circular navigation
 * 
 * @param direction - Direction to move focus ('forward' or 'backward')
 * @param container - Optional container to limit search scope
 * 
 * @example
 * ```typescript
 * // In a custom menu component
 * const handleKeyDown = (e: KeyboardEvent) => {
 *   if (isKeyPressed(e, KeyboardKeys.ARROW_DOWN)) {
 *     moveFocusToAdjacentElement('forward', menuRef.current!)
 *   }
 * }
 * ```
 */
export const moveFocusToAdjacentElement = (
  direction: 'forward' | 'backward',
  container?: HTMLElement
): void => {
  const focusContainer = container || document.body
  const focusableElements = getAllFocusableElements(focusContainer)
  
  if (focusableElements.length === 0) return
  
  const currentIndex = focusableElements.findIndex(el => el === document.activeElement)
  
  if (currentIndex === -1) {
    // No element focused, focus first
    focusableElements[0].focus()
    return
  }
  
  let nextIndex: number
  if (direction === 'forward') {
    nextIndex = (currentIndex + 1) % focusableElements.length
  } else {
    nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length
  }
  
  focusableElements[nextIndex].focus()
}

/**
 * Create ARIA attributes object for a component
 * Simplifies adding accessibility attributes
 * 
 * @param config - ARIA configuration
 * @returns Object with ARIA attributes
 * 
 * @example
 * ```typescript
 * const buttonProps = createAriaAttributes({
 *   label: 'Close dialog',
 *   pressed: isExpanded,
 *   controls: 'dialog-content',
 *   expanded: isExpanded
 * })
 * 
 * <button {...buttonProps}>Close</button>
 * ```
 */
export const createAriaAttributes = (config: {
  label?: string
  labelledBy?: string
  describedBy?: string
  pressed?: boolean
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
  controls?: string
  owns?: string
  role?: string
  live?: AriaLivePoliteness
  atomic?: boolean
  relevant?: string
}): Record<string, string | boolean | undefined> => {
  const attrs: Record<string, string | boolean | undefined> = {}
  
  if (config.label) attrs['aria-label'] = config.label
  if (config.labelledBy) attrs['aria-labelledby'] = config.labelledBy
  if (config.describedBy) attrs['aria-describedby'] = config.describedBy
  if (config.pressed !== undefined) attrs['aria-pressed'] = config.pressed.toString()
  if (config.expanded !== undefined) attrs['aria-expanded'] = config.expanded.toString()
  if (config.selected !== undefined) attrs['aria-selected'] = config.selected.toString()
  if (config.disabled !== undefined) attrs['aria-disabled'] = config.disabled.toString()
  if (config.controls) attrs['aria-controls'] = config.controls
  if (config.owns) attrs['aria-owns'] = config.owns
  if (config.role) attrs['role'] = config.role
  if (config.live) attrs['aria-live'] = config.live
  if (config.atomic !== undefined) attrs['aria-atomic'] = config.atomic.toString()
  if (config.relevant) attrs['aria-relevant'] = config.relevant
  
  return attrs
}

/**
 * Enable/disable focus visible indicators based on input method
 * Shows focus rings only for keyboard navigation, not mouse clicks
 * 
 * @example
 * ```typescript
 * // Initialize once in your app
 * useEffect(() => {
 *   enableSmartFocusVisibility()
 * }, [])
 * ```
 */
export const enableSmartFocusVisibility = (): void => {
  let isUsingKeyboard = false
  
  // Detect keyboard usage
  const handleKeyDown = () => {
    isUsingKeyboard = true
    document.body.classList.add('using-keyboard')
  }
  
  // Detect mouse usage
  const handleMouseDown = () => {
    isUsingKeyboard = false
    document.body.classList.remove('using-keyboard')
  }
  
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('mousedown', handleMouseDown)
  
  // Add CSS for focus-visible
  const style = document.createElement('style')
  style.textContent = `
    /* Hide focus rings by default */
    *:focus {
      outline: none;
    }
    
    /* Show focus rings only when using keyboard */
    body.using-keyboard *:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
  `
  document.head.appendChild(style)
}

/**
 * Skip to main content link handler
 * Implements accessibility best practice for keyboard navigation
 * 
 * @param mainContentId - ID of the main content element
 * @returns Click handler function
 * 
 * @example
 * ```typescript
 * <a href="#main" onClick={createSkipToMainContentHandler('main')}>
 *   Skip to main content
 * </a>
 * ```
 */
export const createSkipToMainContentHandler = (
  mainContentId: string
): ((event: React.MouseEvent | MouseEvent) => void) => {
  return (event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    
    const mainContent = document.getElementById(mainContentId)
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}
