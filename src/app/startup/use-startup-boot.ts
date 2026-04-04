import { useEffect, useState } from "react";
import { isLimitedBandwidth, preloadResources } from "@/lib/resource-preloader";
import {
  buildStartupBootResources,
  STARTUP_PACK_VERSION,
} from "./startup-boot-resources";
import {
  getStartupBootPhase,
  type StartupBootPhase,
} from "./startup-boot-phase";
import {
  hasReadyStartupPack,
  markStartupPackReady,
} from "./startup-persistence";

export interface StartupBootState {
  ready: boolean;
  percentage: number;
  phase: StartupBootPhase;
  label: string;
}

const getBootLabel = (phase: StartupBootPhase): string => {
  if (phase === "introReady") return "Preparing intro";
  if (phase === "cacheWarm") return "Warming startup resources";
  if (phase === "complete") return "Ready to start";
  return "Preparing welcome screen";
};

export const useStartupBoot = (enabled: boolean): StartupBootState => {
  const [state, setState] = useState<StartupBootState>({
    ready: false,
    percentage: 0,
    phase: "branding",
    label: getBootLabel("branding"),
  });
  const hasWarmStartupPack =
    enabled && hasReadyStartupPack(STARTUP_PACK_VERSION);

  useEffect(() => {
    if (!enabled || hasWarmStartupPack) {
      return;
    }

    let cancelled = false;
    const limitedBandwidth = isLimitedBandwidth();
    const resources = buildStartupBootResources(limitedBandwidth);

    void preloadResources(resources, (progress) => {
      if (cancelled) return;
      const phase = getStartupBootPhase(progress.percentage);
      setState({
        ready: false,
        percentage: progress.percentage,
        phase,
        label: getBootLabel(phase),
      });
    }).then((progress) => {
      if (cancelled) return;
      if (progress.failed === 0) {
        markStartupPackReady(STARTUP_PACK_VERSION);
      }
      setState({
        ready: true,
        percentage: 100,
        phase: "complete",
        label: getBootLabel("complete"),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, hasWarmStartupPack]);

  if (hasWarmStartupPack) {
    return {
      ready: true,
      percentage: 100,
      phase: "complete",
      label: getBootLabel("complete"),
    };
  }

  return state;
};
