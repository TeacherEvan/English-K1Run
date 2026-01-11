import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { eventTracker, GameEvent, PerformanceMetrics } from '../lib/event-tracker'

interface EventTrackerDebugProps {
  isVisible: boolean
  onToggle: () => void
}

export function EventTrackerDebug({ isVisible, onToggle }: EventTrackerDebugProps) {
  const [events, setEvents] = useState<GameEvent[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'user_action'>('all')

  useEffect(() => {
    if (!isVisible) return

    const updateData = () => {
      const allEvents = eventTracker.getEvents(filter === 'all' ? undefined : filter, undefined, 50)
      setEvents(allEvents)
      setPerformanceMetrics(eventTracker.getPerformanceMetrics())
    }

    updateData()
    const interval = setInterval(updateData, 1000)
    return () => clearInterval(interval)
  }, [isVisible, filter])

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-destructive hover:bg-destructive/90"
        size="sm"
      >
        Debug
      </Button>
    )
  }

  const getEventBadgeVariant = (type: GameEvent['type']) => {
    switch (type) {
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      case 'user_action': return 'default'
      case 'performance': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>Event Tracker Debug</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => eventTracker.clearEvents()}
              >
                Clear Events
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const data = eventTracker.exportEvents()
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `game-events-${Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Export
              </Button>
              <Button onClick={onToggle} size="sm">
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Performance Metrics */}
          {performanceMetrics && (
            <div className="grid grid-cols-4 gap-4 shrink-0">
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm font-medium">Frame Rate</div>
                  <div className="text-lg font-bold">{performanceMetrics.frameRate} FPS</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm font-medium">Spawn Rate</div>
                  <div className="text-lg font-bold">{performanceMetrics.objectSpawnRate}/s</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm font-medium">Touch Latency</div>
                  <div className="text-lg font-bold">{performanceMetrics.touchLatency.toFixed(1)}ms</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm font-medium">Total Events</div>
                  <div className="text-lg font-bold">{events.length}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2 shrink-0">
            {(['all', 'error', 'warning', 'info', 'user_action'] as const).map(type => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
                className="capitalize"
              >
                {type === 'all' ? 'All' : type.replace('_', ' ')}
              </Button>
            ))}
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-auto space-y-2">
            {events.map((event) => (
              <Card key={event.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getEventBadgeVariant(event.type)}>
                        {event.type}
                      </Badge>
                      <Badge variant="outline">{event.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-medium text-sm mb-1">{event.message}</div>
                    {event.data && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer">View Data</summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {event.stackTrace && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer">Stack Trace</summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {event.stackTrace}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {events.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No events found for the selected filter.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}