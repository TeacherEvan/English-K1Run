import { lazy, Suspense, useCallback, useState } from "react";
import "./App.css";

import { AppStartupGate } from "./app/components/AppStartupGate";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { useStartupBoot } from "./app/startup/use-startup-boot";
import { useAppBootSignal } from "./app/use-app-boot";
import { useE2EMode } from "./app/use-e2e-mode";
import { useRenderMeasurement } from "./app/use-render-measurement";
import { useWebVitalsMonitor } from "./app/use-web-vitals-monitor";

const AppExperience = lazy(() =>
  import("./app/components/AppExperience").then((m) => ({
    default: m.AppExperience,
  })),
);

function App() {
  const isE2E = useE2EMode();

  const [startupStep, setStartupStep] = useState<"boot" | "welcome" | "menu">(
    isE2E ? "menu" : "boot",
  );

  useAppBootSignal();
  useWebVitalsMonitor();
  useRenderMeasurement();

  const startupBoot = useStartupBoot(!isE2E && startupStep === "boot");
  const effectiveStartupStep =
    startupStep === "boot" && startupBoot.ready ? "welcome" : startupStep;

  const handleWelcomeComplete = useCallback(() => {
    setStartupStep("menu");
  }, []);

  if (effectiveStartupStep === "boot" || effectiveStartupStep === "welcome") {
    return (
      <AppStartupGate
        startupStep={effectiveStartupStep}
        isLoading={false}
        onWelcomeComplete={handleWelcomeComplete}
        onLoadingComplete={() => {}}
        bootPercentage={startupBoot.percentage}
        bootPhase={startupBoot.phase}
        bootLabel={startupBoot.label}
      />
    );
  }

  return (
    <Suspense fallback={<LoadingSkeleton variant="menu" />}>
      <AppExperience isE2E={isE2E} />
    </Suspense>
  );
}

export default App;