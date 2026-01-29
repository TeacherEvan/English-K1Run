import { memo, useEffect, useState } from 'react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'

interface DisplayInfoProps {
  isVisible: boolean
  screenWidth: number
  screenHeight: number
  aspectRatio: number
  scale: number
  fontSize: number
  objectSize: number
  turtleSize: number
  fallSpeed: number
  isLandscape: boolean
  onToggle: () => void
}

// FPS tracking
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 0;

export const getFps = () => currentFps;

export const DisplayInfo = memo(({
  isVisible,
  screenWidth,
  screenHeight,
  aspectRatio,
  scale,
  fontSize,
  objectSize,
  turtleSize,
  fallSpeed,
  isLandscape,
  onToggle
}: DisplayInfoProps) => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const updateFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        currentFps = frameCount;
        setFps(frameCount);
        frameCount = 0;
        lastFpsTime = now;
      }
      animationFrameId = requestAnimationFrame(updateFps);
    };

    animationFrameId = requestAnimationFrame(updateFps);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-accent text-accent-foreground p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        style={{ fontSize: `calc(1rem * var(--font-scale, 1))` }}
        aria-label="Show display information"
      >
        📱
      </button>
    )
  }

  const getScreenCategory = () => {
    if (screenWidth < 768) return "Small (Mobile)"
    if (screenWidth < 1200) return "Medium (Tablet)"
    if (screenWidth < 1920) return "Large (Desktop)"
    return "Extra Large (4K+)"
  }

  const getAspectRatioCategory = () => {
    if (aspectRatio > 2.5) return "Ultra-wide"
    if (aspectRatio < 0.6) return "Very Tall"
    return "Standard"
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-xl border-2 border-accent/30 max-w-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-accent" style={{ fontSize: `calc(1rem * var(--font-scale, 1))` }}>
            Display Info
          </h3>
          <button
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
            style={{ fontSize: `calc(1.25rem * var(--font-scale, 1))` }}
            aria-label="Close display information"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2" style={{ fontSize: `calc(0.75rem * var(--font-scale, 1))` }}>
          <div className="flex justify-between">
            <span>Screen:</span>
            <Badge variant="outline">{getScreenCategory()}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Resolution:</span>
            <span className="font-mono">{screenWidth}×{screenHeight}</span>
          </div>

          <div className="flex justify-between">
            <span>Aspect Ratio:</span>
            <Badge variant="outline">{getAspectRatioCategory()}</Badge>
          </div>

          <div className="flex justify-between">
            <span>Orientation:</span>
            <span>{isLandscape ? '🖥️ Landscape' : '📱 Portrait'}</span>
          </div>

          <hr className="border-border" />

          <div className="flex justify-between">
            <span>Scale:</span>
            <span className="font-mono">{scale.toFixed(2)}×</span>
          </div>

          <div className="flex justify-between">
            <span>Font Scale:</span>
            <span className="font-mono">{fontSize.toFixed(2)}×</span>
          </div>

          <div className="flex justify-between">
            <span>Object Scale:</span>
            <span className="font-mono">{objectSize.toFixed(2)}×</span>
          </div>

          <div className="flex justify-between">
            <span>Turtle Scale:</span>
            <span className="font-mono">{turtleSize.toFixed(2)}×</span>
          </div>

          <div className="flex justify-between">
            <span>Fall Speed:</span>
            <span className="font-mono">{fallSpeed.toFixed(2)}×</span>
          </div>

          <hr className="border-border" />

          <div className="flex justify-between">
            <span>FPS:</span>
            <Badge variant={fps >= 50 ? "default" : fps >= 30 ? "secondary" : "destructive"}>
              {fps}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
})

DisplayInfo.displayName = 'DisplayInfo'