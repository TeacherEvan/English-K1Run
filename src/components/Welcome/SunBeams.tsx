import { memo } from 'react'

export const SunBeams = memo(() => {
  return (
    <div className="welcome-sun-beams" aria-hidden="true">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Central sun glow */}
        <circle cx="100" cy="100" r="40" fill="url(#sunGradient)" />
        
        {/* Sun beams - 16 rays */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16
          const radians = (angle * Math.PI) / 180
          const innerRadius = 45
          const outerRadius = 95
          
          const x1 = 100 + innerRadius * Math.cos(radians)
          const y1 = 100 + innerRadius * Math.sin(radians)
          const x2 = 100 + outerRadius * Math.cos(radians)
          const y2 = 100 + outerRadius * Math.sin(radians)
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
              opacity={0.7}
            />
          )
        })}
      </svg>
    </div>
  )
})

SunBeams.displayName = 'SunBeams'