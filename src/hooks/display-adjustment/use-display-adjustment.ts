/**
 * Hook that computes display scaling and exposes screen helpers.
 * The implementation delegates math and CSS updates to helpers.
 */
import { useSettings } from "@/context/settings-context";
import { emitDisplayAdjustmentSignal } from "@/lib/display-adjustment-signal";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  calculateScaleValues,
  getViewportMetrics,
} from "./display-adjustment-calculations";
import {
  applyAppHeightVariable,
  applyDisplayCSSVariables,
  getCSSUpdateStats,
  initializeDisplayCSSVars,
} from "./display-adjustment-css";
import type { DisplaySettings } from "./display-adjustment-types";

export { getCSSUpdateStats };

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

  const updateDisplaySettingsRef = useRef<(() => void) | null>(null);

  const emitDisplayAdjustment = useCallback(
    (
      cause:
        | "initialization"
        | "resize"
        | "orientation"
        | "fullscreen"
        | "programmatic",
    ) => {
      emitDisplayAdjustmentSignal(cause);
    },
    [],
  );

  const triggerResizeUpdate = useCallback(() => {
    updateDisplaySettingsRef.current?.();
    emitDisplayAdjustment("programmatic");
  }, [emitDisplayAdjustment]);

  useEffect(() => {
    initializeDisplayCSSVars();

    const updateDisplaySettings = () => {
      const viewport = getViewportMetrics();
      const scaleValues = calculateScaleValues(viewport, resolutionScale);

      applyDisplayCSSVariables(scaleValues);
      applyAppHeightVariable(viewport.height);

      setDisplaySettings((prev) => {
        if (
          prev.scale === scaleValues.scale &&
          prev.fontSize === scaleValues.fontSize &&
          prev.objectSize === scaleValues.objectSize &&
          prev.turtleSize === scaleValues.turtleSize &&
          prev.spacing === scaleValues.spacing &&
          prev.fallSpeed === scaleValues.fallSpeed &&
          prev.screenWidth === viewport.width &&
          prev.screenHeight === viewport.height
        ) {
          return prev;
        }

        return {
          scale: scaleValues.scale,
          fontSize: scaleValues.fontSize,
          objectSize: scaleValues.objectSize,
          turtleSize: scaleValues.turtleSize,
          spacing: scaleValues.spacing,
          fallSpeed: scaleValues.fallSpeed,
          isLandscape: viewport.isLandscape,
          screenWidth: viewport.width,
          screenHeight: viewport.height,
          aspectRatio: viewport.aspectRatio,
        };
      });
    };

    updateDisplaySettings();
    emitDisplayAdjustment("initialization");

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateDisplaySettings();
        emitDisplayAdjustment("resize");
      }, 100);
    };

    let orientationTimeout: NodeJS.Timeout;
    const handleOrientationChange = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(() => {
        updateDisplaySettings();
        emitDisplayAdjustment("orientation");
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    const handleFullscreenChange = () => {
      updateDisplaySettings();
      emitDisplayAdjustment("fullscreen");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    updateDisplaySettingsRef.current = updateDisplaySettings;

    return () => {
      clearTimeout(resizeTimeout);
      clearTimeout(orientationTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      updateDisplaySettingsRef.current = null;
    };
  }, [emitDisplayAdjustment, resolutionScale]);

  const getScaledStyles = useMemo(
    () =>
      ({
        "--game-scale": displaySettings.scale.toString(),
        "--font-scale": displaySettings.fontSize.toString(),
        "--object-scale": displaySettings.objectSize.toString(),
        "--turtle-scale": displaySettings.turtleSize.toString(),
        "--spacing-scale": displaySettings.spacing.toString(),
        "--fall-speed-scale": displaySettings.fallSpeed.toString(),
      }) as CSSProperties,
    [displaySettings],
  );

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
