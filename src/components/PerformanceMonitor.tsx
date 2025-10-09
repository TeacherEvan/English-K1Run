import { useState, useEffect, memo } from 'react'
import { eventTracker } from '../lib/event-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface PerformanceStats {
  fps: number
  objectCount: number
  spawnRate: number
  memoryUsage: number
  renderTime: number
}

export const PerformanceMonitor = memo(() => {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    objectCount: 0,
    spawnRate: 0,
    memoryUsage: 0,
    renderTime: 0
  })

  useEffect(() => {
    if (!isVisible) return

    let frameCount = 0
    let lastTime = performance.now()
    let renderTimeSum = 0
    let renderTimeCount = 0

    const updateStats = () => {
      const startTime = performance.now()
      
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
        
        const metrics = eventTracker.getPerformanceMetrics()
        const averageRenderTime = renderTimeCount > 0 ? renderTimeSum / renderTimeCount : 0
        
        // Chrome-specific memory API (not available in all browsers)
        const perfWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number } }
        
        setStats({
          fps,
          objectCount: document.querySelectorAll('.falling-object, [class*="absolute cursor-pointer"]').length,
          spawnRate: metrics.objectSpawnRate,
          memoryUsage: perfWithMemory.memory ? Math.round(perfWithMemory.memory.usedJSHeapSize / 1024 / 1024) : 0,
          renderTime: Math.round(averageRenderTime * 100) / 100
        })
        
        // Reset render time tracking
        renderTimeSum = 0
        renderTimeCount = 0
      }
      
      // Track render time
      const endTime = performance.now()
      renderTimeSum += endTime - startTime
      renderTimeCount++
      
      requestAnimationFrame(updateStats)
    }
    
    const animationId = requestAnimationFrame(updateStats)
    return () => cancelAnimationFrame(animationId)
  }, [isVisible])

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return 'text-green-600'
    if (fps >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getObjectCountColor = (count: number) => {
    if (count <= 10) return 'text-green-600'
    if (count <= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 bg-white/90 hover:bg-white"
      >
        {isVisible ? '📊 Hide' : '📊 Perf'}
      </Button>

      {/* Performance Panel */}
      {isVisible && (
        <Card className="fixed bottom-16 left-4 z-50 w-64 bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={`font-mono ${getPerformanceColor(stats.fps)}`}>
                {stats.fps}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Objects:</span>
              <span className={`font-mono ${getObjectCountColor(stats.objectCount)}`}>
                {stats.objectCount}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Spawn Rate:</span>
              <span className="font-mono text-blue-600">
                {stats.spawnRate.toFixed(1)}/s
              </span>
            </div>
            
            {stats.memoryUsage > 0 && (
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="font-mono text-purple-600">
                  {stats.memoryUsage} MB
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Render:</span>
              <span className="font-mono text-gray-600">
                {stats.renderTime}ms
              </span>
            </div>

            {/* Performance Indicators */}
            <div className="pt-2 border-t space-y-1">
              {stats.fps < 30 && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  ⚠️ Low FPS detected
                </div>
              )}
              {stats.objectCount > 15 && (
                <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  ⚠️ High object count
                </div>
              )}
              {stats.renderTime > 16 && (
                <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  ⚠️ Slow render time
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor'