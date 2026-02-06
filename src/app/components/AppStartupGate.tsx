import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";

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
    startupStep: "welcome" | "menu";
    isLoading: boolean;
    onWelcomeComplete: () => void;
    onLoadingComplete: () => void;
    autoCompleteAfterMs?: number;
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
}: AppStartupGateProps) => {
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
