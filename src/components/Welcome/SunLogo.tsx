import { memo } from 'react'

interface SunLogoProps {
    phase: 'intro' | 'tagline'
    size?: number
}

export const SunLogo = memo(({ phase, size = 96 }: SunLogoProps) => {
    const isIntro = phase === 'intro'

    return (
        <div className="mb-8 flex justify-center" aria-hidden>
            <div
                className="relative"
                style={{
                    animation: 'gentlePulse 2s ease-in-out infinite',
                    transform: isIntro ? 'scale(1)' : 'scale(1.15)',
                    transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: 'translateZ(-20px)' }}
                >
                    <div
                        className="rounded-full"
                        style={{
                            width: size * 0.42,
                            height: size * 0.42,
                            background: isIntro
                                ? 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0) 70%)'
                                : 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(236,72,153,0.3) 50%, rgba(139,92,246,0) 70%)',
                            filter: 'blur(8px)',
                            animation: 'pulse 3s ease-in-out infinite',
                            transition: 'background 1s ease-in-out'
                        }}
                    />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="w-32 h-32 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%)',
                            animation: 'rotate 20s linear infinite'
                        }}
                    >
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1"
                                style={{
                                    height: '56px',
                                    left: '50%',
                                    top: '50%',
                                    transformOrigin: '0 0',
                                    transform: `rotate(${i * 22.5}deg) translateX(-0.5px)`,
                                    background: isIntro
                                        ? 'linear-gradient(to top, #fbbf24, #fb923c, transparent)'
                                        : `linear-gradient(to top, ${['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i % 4]}, transparent)`,
                                    opacity: 0.7,
                                    animation: `rayPulse ${2 + (i % 3)}s ease-in-out infinite`,
                                    animationDelay: `${i * 0.1}s`,
                                    transition: 'background 1s ease-in-out'
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div
                    className="relative z-10 flex items-center justify-center rounded-full border-4"
                    style={{
                        width: size,
                        height: size,
                        background: isIntro
                            ? 'linear-gradient(135deg, #fef08a, #fde047, #facc15, #f59e0b)'
                            : 'linear-gradient(135deg, #ddd6fe, #c4b5fd, #a78bfa, #8b5cf6)',
                        borderColor: isIntro ? '#fef08a' : '#ddd6fe',
                        transform: 'translateZ(30px)',
                        boxShadow: isIntro
                            ? '0 20px 60px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.4)'
                            : '0 20px 60px rgba(139,92,246,0.6), 0 0 40px rgba(139,92,246,0.4)',
                        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <div className="text-4xl" role="img" aria-label="Happy sun">😊</div>
                </div>
            </div>
        </div>
    )
})

SunLogo.displayName = 'SunLogo'
