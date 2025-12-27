import { memo } from 'react'

interface AnimatedTextProps {
    audioPhase: 'intro' | 'tagline'
    showTagline: boolean
}

export const AnimatedText = memo(({ audioPhase, showTagline }: AnimatedTextProps) => {
    return (
        <div className="space-y-6 min-h-[300px] flex flex-col justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {/* Phase 1: Partnership Introduction with glassmorphism card */}
            <div
                className={`transition-all duration-700 ${audioPhase === 'intro' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none absolute'} `}
                style={{
                    transform: audioPhase === 'intro' ? 'translateZ(10px) rotateY(0deg)' : 'translateZ(10px) rotateY(90deg)',
                    transformStyle: 'preserve-3d',
                    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15), inset 0 0 40px rgba(255,255,255,0.1)' }}>
                    <p className="font-semibold text-gray-800 mb-4" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                        In association with
                    </p>

                    {/* Kindergarten name with premium gradient */}
                    <h1 className="font-bold bg-clip-text text-transparent" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', background: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fb923c, #ea580c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', textShadow: '0 4px 24px rgba(251, 191, 36, 0.3)', letterSpacing: '-0.02em', animation: 'shimmer 3s ease-in-out infinite' }}>
                        LALITAPORN
                    </h1>
                    <h2 className="font-bold text-amber-700 mt-2" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                        Kindergarten
                    </h2>

                    {/* Thai text */}
                    <p className="font-semibold text-amber-700 mt-3" style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', 'Tahoma', system-ui, sans-serif", fontWeight: 600, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                        อนุบาลลลิดาภรณ์
                    </p>
                </div>
            </div>

            {/* Phase 2: Tagline with Children's Energy and glassmorphism */}
            <div
                className={`transition-all duration-700 ${showTagline ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none absolute'} `}
                style={{
                    transform: showTagline ? 'translateZ(20px) rotateY(0deg)' : 'translateZ(20px) rotateY(-90deg)',
                    transformStyle: 'preserve-3d',
                    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15), inset 0 0 40px rgba(255,255,255,0.1)', animation: showTagline ? 'cardBounce 0.7s ease-out' : 'none' }}>
                    <div className="font-bold bg-clip-text text-transparent px-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)', WebkitBackgroundClip: 'text', backgroundClip: 'text', textShadow: '0 4px 24px rgba(139, 92, 246, 0.3)', lineHeight: '1.2', animation: 'shimmer 4s ease-in-out infinite' }}>
                        {/* Letter-by-letter reveal animation */}
                        {'Learning through games'.split('').map((char, i) => (
                            <span key={i} style={{ display: 'inline-block', animation: showTagline ? `letterReveal 0.05s ease-out ${i * 0.03}s both` : 'none' }}>{char === ' ' ? '\u00A0' : char}</span>
                        ))}
                        <br />
                        <span className="font-extrabold" style={{ fontSize: 'clamp(3rem, 7vw, 5rem)' }}>{'for everyone!'.split('').map((char, i) => (
                            <span key={i} style={{ display: 'inline-block', animation: showTagline ? `letterReveal 0.05s ease-out ${(i + 20) * 0.03}s both` : 'none' }}>{char === ' ' ? '\u00A0' : char}</span>
                        ))}</span>
                    </div>

                    {/* Animated stars */}
                    <div className="flex justify-center gap-4 mt-6">
                        {['🌟', '✨', '💫', '✨', '🌟'].map((star, i) => (
                            <span key={i} style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', display: 'inline-block', animation: showTagline ? `starTwinkle ${1.5 + (i * 0.2)}s ease-in-out ${i * 0.1}s infinite` : 'none' }}>{star}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
})

AnimatedText.displayName = 'AnimatedText'
