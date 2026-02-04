import { FIREWORK_COLORS } from "./constants";
import { useFireworks } from "./use-fireworks";

interface FireworksDisplayProps {
    isVisible: boolean;
    winner: boolean;
}

/**
 * FireworksDisplay - Win celebration overlay with fireworks and confetti.
 */
export function FireworksDisplay({ isVisible, winner }: FireworksDisplayProps) {
    const { fireworks, confettiElements } = useFireworks(isVisible, winner);

    if (!isVisible || !winner) return null;

    return (
        <div data-testid="fireworks" className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bounce-in">
                    <h1
                        className="text-6xl sm:text-7xl md:text-8xl font-bold text-white drop-shadow-2xl mb-4"
                        style={{
                            fontSize: `calc(4rem * var(--font-scale, 1))`,
                            textShadow:
                                "0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3)",
                        }}
                    >
                        🎉 YOU WIN! 🎉
                    </h1>
                    <div
                        className="text-5xl sm:text-6xl"
                        style={{ fontSize: `calc(3rem * var(--font-scale, 1))` }}
                    >
                        🏆
                    </div>
                </div>
            </div>

            <svg className="absolute inset-0 w-full h-full">
                {fireworks.map((firework) =>
                    firework.particles.map((particle) => (
                        <circle
                            key={particle.id}
                            cx={particle.x}
                            cy={particle.y}
                            r={Math.max(1, particle.life * 3)}
                            fill={particle.color || FIREWORK_COLORS[0]}
                            opacity={particle.life * 0.8}
                        />
                    )),
                )}
            </svg>

            <div className="absolute inset-0">
                {confettiElements.map((element) => (
                    <div
                        key={element.id}
                        className="absolute"
                        style={{
                            left: `${element.left}%`,
                            top: "-10px",
                            animation: `fall ${element.animationDuration}s linear ${element.animationDelay}s infinite`,
                        }}
                    >
                        <div
                            className="w-2 h-2"
                            style={{
                                backgroundColor: element.color,
                                transform: `rotate(${element.rotation}deg)`,
                                opacity: 0.7,
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
