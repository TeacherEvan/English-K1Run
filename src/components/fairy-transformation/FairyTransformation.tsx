import { memo } from "react";
import { FAIRY_VISUAL_CONSTANTS } from "../../lib/constants/fairy-animations";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";
import type { FairyTransformationProps } from "./types";
import { useFairyAnimation } from "./use-fairy-animation";

/**
 * FairyTransformation - Animated worm-to-fairy effect with sparkles.
 */
export const FairyTransformation = memo(({ fairy }: FairyTransformationProps) => {
    const {
        age,
        phase,
        fairyPos,
        orbitingSparkles,
        trailSparkles,
        colorPalette,
        morphProgress,
        fairyOpacity,
        wormOpacity,
        fairyFadeIn,
        morphScale,
        glowIntensity,
        isVisible,
    } = useFairyAnimation(fairy);

    if (!isVisible && trailSparkles.length === 0) return null;

    return (
        <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{ zIndex: UI_LAYER_MATRIX.GAMEPLAY_EFFECTS }}
        >
            {fairyOpacity > 0 && (
                <div
                    className="absolute fairy-transform"
                    style={{
                        left: `${fairyPos.x}%`,
                        top: `${fairyPos.y}px`,
                        width: `${FAIRY_VISUAL_CONSTANTS.FAIRY_SIZE}px`,
                        height: `${FAIRY_VISUAL_CONSTANTS.FAIRY_SIZE}px`,
                        fontSize: `${FAIRY_VISUAL_CONSTANTS.FAIRY_SIZE}px`,
                        transform: `translate(-50%, -50%) scale(${morphScale}) rotate(${morphProgress * 360}deg)`,
                        filter: `drop-shadow(0 0 ${glowIntensity}px ${colorPalette[0]}) drop-shadow(0 0 ${glowIntensity * 2}px ${colorPalette[1]})`,
                        transition: phase === "morphing" ? "none" : "transform 0.05s linear",
                        opacity: fairyOpacity,
                    }}
                >
                    {wormOpacity > 0 && (
                        <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ opacity: wormOpacity }}
                        >
                            🐛
                        </span>
                    )}
                    {fairyFadeIn > 0 && (
                        <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ opacity: fairyFadeIn }}
                        >
                            🧚
                        </span>
                    )}
                </div>
            )}

            {phase !== "trail-fading" &&
                fairyOpacity > 0 &&
                orbitingSparkles.map((sparkle, i) => {
                    const orbitAngle =
                        sparkle.angle + (age / 1000) * sparkle.speed * Math.PI * 2;
                    const pulseScale = 0.8 + Math.sin(age / 150 + i) * 0.4;
                    const sparkleX =
                        fairyPos.x + (Math.cos(orbitAngle) * sparkle.distance) / 15;
                    const sparkleY = fairyPos.y + Math.sin(orbitAngle) * sparkle.distance;

                    return (
                        <div
                            key={sparkle.id}
                            className="absolute sparkle-pulse"
                            style={{
                                left: `${sparkleX}%`,
                                top: `${sparkleY}px`,
                                fontSize: `${sparkle.size * pulseScale}px`,
                                transform: "translate(-50%, -50%)",
                                opacity: 0.8 + Math.sin(age / 100 + i * 0.5) * 0.2,
                                filter: `drop-shadow(0 0 4px ${sparkle.color})`,
                            }}
                        >
                            ✨
                        </div>
                    );
                })}

            {trailSparkles.map((sparkle) => (
                <div
                    key={sparkle.id}
                    className="absolute"
                    style={{
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}px`,
                        fontSize: `${sparkle.size}px`,
                        transform: "translate(-50%, -50%)",
                        opacity: sparkle.opacity,
                        filter: `drop-shadow(0 0 ${sparkle.size / 2}px ${colorPalette[sparkle.id % colorPalette.length]})`,
                        transition: "opacity 0.1s ease-out",
                    }}
                >
                    ✨
                </div>
            ))}
        </div>
    );
});

FairyTransformation.displayName = "FairyTransformation";
