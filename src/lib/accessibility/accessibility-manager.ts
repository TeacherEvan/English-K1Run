export interface AccessibilityPreferences {
  animationSpeed: number;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimizations: boolean;
  simplifiedMode: boolean;
  focusIndicatorSize: "small" | "normal" | "large";
}

/**
 * Accessibility preferences manager
 * Handles customizable accessibility settings for the application
 */
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private preferences: AccessibilityPreferences = {
    animationSpeed: 1.0,
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimizations: true,
    simplifiedMode: false,
    focusIndicatorSize: "normal",
  };

  private constructor() {
    this.loadPreferences();
    this.applyPreferences();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Get current accessibility preferences
   */
  getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Update accessibility preferences
   */
  setPreferences(newPreferences: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
    this.applyPreferences();
  }

  /**
   * Set animation speed multiplier (0.5 = half speed, 2.0 = double speed)
   */
  setAnimationSpeed(speed: number): void {
    this.setPreferences({
      animationSpeed: Math.max(0.1, Math.min(3.0, speed)),
    });
  }

  /**
   * Enable/disable high contrast mode
   */
  setHighContrast(enabled: boolean): void {
    this.setPreferences({ highContrast: enabled });
  }

  /**
   * Enable/disable reduced motion
   */
  setReducedMotion(enabled: boolean): void {
    this.setPreferences({ reducedMotion: enabled });
  }

  /**
   * Enable/disable screen reader optimizations
   */
  setScreenReaderOptimizations(enabled: boolean): void {
    this.setPreferences({ screenReaderOptimizations: enabled });
  }

  /**
   * Enable/disable simplified mode for developmental delays
   */
  setSimplifiedMode(enabled: boolean): void {
    this.setPreferences({ simplifiedMode: enabled });
  }

  /**
   * Set focus indicator size
   */
  setFocusIndicatorSize(size: "small" | "normal" | "large"): void {
    this.setPreferences({ focusIndicatorSize: size });
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem("accessibility-preferences");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AccessibilityPreferences>;
        this.preferences = { ...this.preferences, ...parsed };
      }
    } catch (error) {
      console.warn("[AccessibilityManager] Failed to load preferences:", error);
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(
        "accessibility-preferences",
        JSON.stringify(this.preferences),
      );
    } catch (error) {
      console.warn("[AccessibilityManager] Failed to save preferences:", error);
    }
  }

  private applyPreferences(): void {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty(
      "--animation-speed",
      this.preferences.animationSpeed.toString(),
    );
    root.style.setProperty(
      "--focus-indicator-size",
      this.preferences.focusIndicatorSize === "small"
        ? "1px"
        : this.preferences.focusIndicatorSize === "large"
          ? "4px"
          : "2px",
    );

    // Apply class-based preferences
    const body = document.body;

    if (this.preferences.highContrast) {
      body.classList.add("high-contrast");
    } else {
      body.classList.remove("high-contrast");
    }

    if (this.preferences.reducedMotion) {
      body.classList.add("reduced-motion");
    } else {
      body.classList.remove("reduced-motion");
    }

    if (this.preferences.simplifiedMode) {
      body.classList.add("simplified-mode");
    } else {
      body.classList.remove("simplified-mode");
    }

    if (this.preferences.screenReaderOptimizations) {
      body.classList.add("screen-reader-optimized");
    } else {
      body.classList.remove("screen-reader-optimized");
    }
  }
}

/**
 * Get the global accessibility manager instance
 */
export const getAccessibilityManager = (): AccessibilityManager => {
  return AccessibilityManager.getInstance();
};

/**
 * Quick access functions for common accessibility operations
 */
export const accessibility = {
  setAnimationSpeed: (speed: number) =>
    getAccessibilityManager().setAnimationSpeed(speed),
  setHighContrast: (enabled: boolean) =>
    getAccessibilityManager().setHighContrast(enabled),
  setReducedMotion: (enabled: boolean) =>
    getAccessibilityManager().setReducedMotion(enabled),
  setSimplifiedMode: (enabled: boolean) =>
    getAccessibilityManager().setSimplifiedMode(enabled),
  getPreferences: () => getAccessibilityManager().getPreferences(),
  setPreferences: (prefs: Partial<AccessibilityPreferences>) =>
    getAccessibilityManager().setPreferences(prefs),
};
