import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { StartupLoadingScreen } from "../../components/startup/StartupLoadingScreen";
import type { StartupBootPhase } from "../startup/startup-boot-phase";

const WelcomeScreen = lazy(() =>
    import("../../components/WelcomeScreen").then((m) => ({
        default: m.WelcomeScreen,
    })),
);
const WormLoadingScreen = lazy(() =>
    import("../../components/worm-loading").then((m) => ({
        default: m.WormLoadingScreen,
    })),
);

interface AppStartupGateProps {
    startupStep: "boot" | "welcome" | "menu";
    isLoading: boolean;
    onWelcomeComplete: () => void;
    onLoadingComplete: () => void;
    autoCompleteAfterMs?: number;
    bootPercentage?: number;
    bootPhase?: StartupBootPhase;
    bootLabel?: string;
}

/**
 * AppStartupGate - Handles welcome and loading screens before gameplay.
 */
export const AppStartupGate = ({
    startupStep,
    isLoading,
    onWelcomeComplete,
    onLoadingComplete,
    autoCompleteAfterMs,
    bootPercentage = 0,
    bootPhase = "branding",
    bootLabel = "Preparing welcome screen",
}: AppStartupGateProps) => {
    if (startupStep === "boot") {
        return (
            <StartupLoadingScreen
                percentage={bootPercentage}
                phase={bootPhase}
                label={bootLabel}
            />
        );
    }

    if (startupStep === "welcome") {
        return (
            <Suspense fallback={<LoadingSkeleton variant="welcome" />}>
                <WelcomeScreen onComplete={onWelcomeComplete} />
            </Suspense>
        );
    }

    if (isLoading) {
        return (
            <Suspense fallback={<LoadingSkeleton variant="worm" />}>
                <WormLoadingScreen
                    onComplete={onLoadingComplete}
                    autoCompleteAfterMs={autoCompleteAfterMs}
                />
            </Suspense>
        );
    }

    return null;
};
