import { memo } from 'react'

export const WindStreams = memo(() => {
  // Wind stream paths - curved lines simulating wind flow
  const windPaths = [
    'M 0 100 Q 150 80, 300 100 T 600 100',
    'M 0 200 Q 150 180, 300 200 T 600 200',
    'M 0 300 Q 150 280, 300 300 T 600 300',
  ]

  return (
    <div className="welcome-wind-stream" aria-hidden="true">
      <svg
        viewBox="0 0 600 400"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        {windPaths.map((path, index) => (
          <path
            key={index}
            d={path}
            style={{
              animationDelay: `${index * 0.5}s`,
            }}
          />
        ))}
      </svg>
    </div>
  )
})

WindStreams.displayName = 'WindStreams'