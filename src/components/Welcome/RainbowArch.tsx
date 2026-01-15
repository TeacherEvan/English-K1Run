import { memo } from 'react'

export const RainbowArch = memo(() => {
  // Rainbow colors from outer to inner
  const rainbowColors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3', // Violet
  ]

  return (
    <div className="welcome-rainbow" aria-hidden="true">
      <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Multi-color gradient for rainbow effect */}
          <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF0000" />
            <stop offset="16.67%" stopColor="#FF7F00" />
            <stop offset="33.33%" stopColor="#FFFF00" />
            <stop offset="50%" stopColor="#00FF00" />
            <stop offset="66.67%" stopColor="#0000FF" />
            <stop offset="83.33%" stopColor="#4B0082" />
            <stop offset="100%" stopColor="#9400D3" />
          </linearGradient>
        </defs>
        
        {/* Rainbow arch path */}
        <path
          d="M 50 180 Q 300 20, 550 180"
          stroke="url(#rainbowGradient)"
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </div>
  )
})

RainbowArch.displayName = 'RainbowArch'