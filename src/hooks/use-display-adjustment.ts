import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "../context/settings-context";

// Performance monitoring for CSS updates
let cssUpdateCount = 0;
let lastReportTime = Date.now();
const CSS_UPDATE_LOG_THRESHOLD = 100; // Log every 100 updates

export const getCSSUpdateStats = () => ({
  count: cssUpdateCount,
  timeSinceLastReport: Date.now() - lastReportTime,
});

interface DisplaySettings {
  scale: number;
  fontSize: number;
  objectSize: number;
  turtleSize: number;
  spacing: number;
  fallSpeed: number;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  aspectRatio: number;
}

export function useDisplayAdjustment() {
  const { resolutionScale } = useSettings();
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    scale: 1,
    fontSize: 1,
    objectSize: 1,
    turtleSize: 1,
    spacing: 1,
    fallSpeed: 1,
    isLandscape: false,
    screenWidth: 0,
    screenHeight: 0,
    aspectRatio: 1,
  });

  // Store updateDisplaySettings callback in ref so it can be called externally
  const updateDisplaySettingsRef = useRef<(() => void) | null>(null);

  // Create stable callback that can be used externally
  const triggerResizeUpdate = useCallback(() => {
    updateDisplaySettingsRef.current?.();
  }, []);

  useEffect(() => {
    // Initialize CSS variables immediately on mount
    const root = document.documentElement;
    root.style.setProperty("--font-scale", "1");
    root.style.setProperty("--object-scale", "1");
    root.style.setProperty("--turtle-scale", "1");
    root.style.setProperty("--spacing-scale", "1");
    root.style.setProperty("--fall-speed-scale", "1");
    root.style.setProperty("--size-scale", "1");

    // Define updateDisplaySettings as a named function so it can be called externally
    const updateDisplaySettings = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;
      const isLandscape = width > height;

      // Base dimensions for scaling calculations (designed for 1920x1080)
      const baseWidth = 1920;
      const baseHeight = 1080;

      // Calculate scale based on smaller dimension to ensure content fits
      const widthScale = Math.round((width / baseWidth) * 100) / 100;
      const heightScale = Math.round((height / baseHeight) * 100) / 100;
      const baseScale = Math.min(widthScale, heightScale);
      const scaleOverride =
        resolutionScale === "small"
          ? 0.85
          : resolutionScale === "large"
            ? 1.15
            : 1;
      const scale = Math.round(baseScale * scaleOverride * 100) / 100;

      // Optimize calculations by using cached values
      let fontSize = scale;
      let objectSize = scale;
      let turtleSize = scale;
      let spacing = scale;
      let fallSpeed = 1;

      // Simplified breakpoint calculations for better performance
      // Reduced scaling to optimize resource sizes
      if (width < 768) {
        fontSize = Math.max(scale * 1.0, 0.7);
        objectSize = Math.max(scale * 1.0, 0.7);
        turtleSize = Math.max(scale * 0.9, 0.65);
        spacing = Math.max(scale * 1.0, 0.8);
        fallSpeed = 0.7; // Slower for better performance on mobile
      } else if (width < 1200) {
        fontSize = Math.max(scale * 0.95, 0.75);
        objectSize = Math.max(scale * 0.9, 0.75);
        turtleSize = Math.max(scale * 0.9, 0.75);
        spacing = Math.max(scale * 0.95, 0.8);
        fallSpeed = 0.85;
      } else if (width < 1920) {
        fontSize = Math.max(scale * 0.85, 0.8);
        objectSize = Math.max(scale * 0.85, 0.85);
        turtleSize = Math.max(scale * 0.85, 0.8);
        spacing = Math.max(scale * 0.9, 0.85);
        fallSpeed = 1;
      } else {
        fontSize = Math.min(scale * 0.9, 1.0);
        objectSize = Math.min(scale * 0.85, 0.95);
        turtleSize = Math.min(scale * 0.9, 1.0);
        spacing = Math.min(scale * 0.9, 1.0);
        fallSpeed = 1.1;
      }

      // Special adjustments for extreme aspect ratios (reduced for optimization)
      if (aspectRatio > 2.5) {
        spacing *= 1.1;
        objectSize *= 0.85;
      } else if (aspectRatio < 0.6) {
        fontSize *= 1.0;
        objectSize *= 1.0;
        spacing *= 0.9;
      }

      // Portrait mode adjustments (reduced for optimization)
      if (!isLandscape && width < 768) {
        objectSize *= 1.0;
        turtleSize *= 1.0;
        fallSpeed *= 0.8; // Further reduced for mobile portrait
      }

      // Set CSS variables with threshold checking to prevent sub-pixel jitter
      let previousFontScale = 0;
      let previousObjectScale = 0;

      const updateCSSVariable = (
        name: string,
        value: number,
        previous: number,
      ) => {
        if (Math.abs(value - previous) > 0.01) {
          document.documentElement.style.setProperty(name, value.toFixed(2));

          // Performance monitoring for CSS updates
          cssUpdateCount++;
          if (cssUpdateCount % CSS_UPDATE_LOG_THRESHOLD === 0) {
            const elapsed = Date.now() - lastReportTime;
            console.log(
              `[Performance] CSS updates: ${cssUpdateCount} over ${elapsed}ms ` +
                `(${(cssUpdateCount / (elapsed / 1000)).toFixed(2)} updates/sec)`,
            );
            lastReportTime = Date.now();
          }

          return value;
        }
        return previous;
      };

      previousFontScale = updateCSSVariable(
        "--font-scale",
        fontSize,
        previousFontScale,
      );
      previousObjectScale = updateCSSVariable(
        "--object-scale",
        objectSize,
        previousObjectScale,
      );
      document.documentElement.style.setProperty(
        "--turtle-scale",
        turtleSize.toFixed(2),
      );
      document.documentElement.style.setProperty(
        "--spacing-scale",
        spacing.toFixed(2),
      );
      document.documentElement.style.setProperty(
        "--fall-speed-scale",
        fallSpeed.toFixed(2),
      );
      document.documentElement.style.setProperty(
        "--size-scale",
        spacing.toFixed(2),
      );

      setDisplaySettings((prev) => {
        // Only update if values actually changed to prevent unnecessary renders
        if (
          prev.scale === scale &&
          prev.fontSize === fontSize &&
          prev.objectSize === objectSize &&
          prev.turtleSize === turtleSize &&
          prev.spacing === spacing &&
          prev.fallSpeed === fallSpeed &&
          prev.screenWidth === width &&
          prev.screenHeight === height
        ) {
          return prev;
        }

        return {
          scale,
          fontSize,
          objectSize,
          turtleSize,
          spacing,
          fallSpeed,
          isLandscape,
          screenWidth: width,
          screenHeight: height,
          aspectRatio,
        };
      });
    };

    // Initial calculation
    updateDisplaySettings();

    // Debounced resize handler to prevent excessive recalculations
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDisplaySettings, 100);
    };

    // Listen for orientation changes with debounce
    let orientationTimeout: NodeJS.Timeout;
    const handleOrientationChange = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(updateDisplaySettings, 200);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    document.addEventListener("fullscreenchange", updateDisplaySettings);

    // Store the update function in ref for external access
    updateDisplaySettingsRef.current = updateDisplaySettings;

    return () => {
      clearTimeout(resizeTimeout);
      clearTimeout(orientationTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("fullscreenchange", updateDisplaySettings);
      updateDisplaySettingsRef.current = null;
    };
  }, [resolutionScale]);

  // Memoize getScaledStyles to avoid object recreation on every render
  // Uses displaySettings as dependency since setDisplaySettings returns prev when unchanged (stable reference)
  const getScaledStyles = useMemo(
    () =>
      ({
        "--game-scale": displaySettings.scale.toString(),
        "--font-scale": displaySettings.fontSize.toString(),
        "--object-scale": displaySettings.objectSize.toString(),
        "--turtle-scale": displaySettings.turtleSize.toString(),
        "--spacing-scale": displaySettings.spacing.toString(),
        "--fall-speed-scale": displaySettings.fallSpeed.toString(),
      }) as React.CSSProperties,
    [displaySettings],
  );

  // Memoize screen size helpers to cache computed boolean values
  // Uses displaySettings as dependency for simpler maintenance
  const screenHelpers = useMemo(
    () => ({
      isSmallScreen: displaySettings.screenWidth < 768,
      isMediumScreen:
        displaySettings.screenWidth >= 768 &&
        displaySettings.screenWidth < 1200,
      isLargeScreen: displaySettings.screenWidth >= 1200,
      isUltrawide: displaySettings.aspectRatio > 2.5,
      isTallScreen: displaySettings.aspectRatio < 0.6,
    }),
    [displaySettings],
  );

  return {
    displaySettings,
    getScaledStyles,
    triggerResizeUpdate,
    ...screenHelpers,
  };
}
