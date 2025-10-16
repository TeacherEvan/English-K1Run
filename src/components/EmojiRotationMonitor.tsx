import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventTracker } from '@/lib/event-tracker'
import { memo, useEffect, useState } from 'react'

export const EmojiRotationMonitor = memo(() => {
  const [stats, setStats] = useState<ReturnType<typeof eventTracker.getEmojiRotationStats>>([])
  const [health, setHealth] = useState({ healthy: true, overdueCount: 0, maxWaitTime: 0 })
  const [audioStats, setAudioStats] = useState<ReturnType<typeof eventTracker.getAudioPlaybackStats>>({
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    byMethod: {}
  })
  const [isVisible, setIsVisible] = useState(true)

  const updateStats = () => {
    setStats(eventTracker.getEmojiRotationStats())
    setHealth(eventTracker.checkRotationHealth())
    setAudioStats(eventTracker.getAudioPlaybackStats())
  }

  useEffect(() => {
    // Initial update after mount
    const timeout = setTimeout(() => updateStats(), 0)
    const interval = setInterval(updateStats, 1000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-blue-500/90 text-white hover:bg-blue-600"
        >
          📊 Rotation Monitor
        </Button>
      </div>
    )
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-[500px] max-h-[700px] bg-black/90 text-white border-blue-500 overflow-hidden">
      <CardHeader className="pb-3 border-b border-blue-500/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Emoji Rotation & Audio Tracker
            <Badge variant={health.healthy ? "default" : "destructive"} className="ml-2">
              {health.healthy ? '✅ Healthy' : `⚠️ ${health.overdueCount} Overdue`}
            </Badge>
          </CardTitle>
          <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
            ➖
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 overflow-y-auto max-h-[600px]">
        {/* Audio Playback Stats */}
        <div className="mb-4 p-3 bg-purple-900/20 rounded border border-purple-500/30">
          <h3 className="text-sm font-semibold mb-2">🔊 Audio Playback</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-gray-400">Total</div>
              <div className="text-lg font-bold">{audioStats.totalAttempts}</div>
            </div>
            <div>
              <div className="text-gray-400">Success</div>
              <div className="text-lg font-bold text-green-400">{audioStats.successful}</div>
            </div>
            <div>
              <div className="text-gray-400">Failed</div>
              <div className="text-lg font-bold text-red-400">{audioStats.failed}</div>
            </div>
          </div>
          {Object.keys(audioStats.byMethod).length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-400">By Method:</div>
              {Object.entries(audioStats.byMethod).map(([method, counts]) => (
                <div key={method} className="flex justify-between text-xs">
                  <span className="text-gray-300">{method}</span>
                  <span>
                    <span className="text-green-400">{counts.success}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-red-400">{counts.failed}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rotation Health Summary */}
        <div className="mb-4 p-3 bg-blue-900/20 rounded border border-blue-500/30">
          <h3 className="text-sm font-semibold mb-2">🔄 Rotation Health</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-400">Max Wait Time</div>
              <div className="text-lg font-bold">
                {(health.maxWaitTime / 1000).toFixed(1)}s
              </div>
            </div>
            <div>
              <div className="text-gray-400">Threshold</div>
              <div className="text-lg font-bold text-yellow-400">10.0s</div>
            </div>
          </div>
        </div>

        {/* Emoji List */}
        {stats.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-4xl mb-2">🎮</p>
            <p>Start a game to begin tracking</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-400 mb-2">
              Tracking {stats.length} emojis
            </div>

            {stats.map((stat, idx) => {
              const isOverdue = stat.timeSinceLastAppearance > 10000
              const neverAppeared = stat.appearanceCount === 0
              const timeSec = stat.timeSinceLastAppearance / 1000

              return (
                <div
                  key={`${stat.emoji}-${idx}`}
                  className={`p-2 rounded border ${
                    isOverdue
                      ? 'bg-red-900/20 border-red-500/50'
                      : neverAppeared
                      ? 'bg-yellow-900/20 border-yellow-500/50'
                      : 'bg-green-900/10 border-green-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stat.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold">{stat.name}</div>
                        <div className="text-xs text-gray-400">
                          Count: {stat.appearanceCount}
                          {stat.audioPlayed && (
                            <span className="ml-2 text-green-400">🔊</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        isOverdue ? 'text-red-400' : 
                        timeSec > 7 ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        {timeSec.toFixed(1)}s
                      </div>
                      {neverAppeared && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Never
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button onClick={updateStats} variant="outline" size="sm" className="flex-1">
            🔄 Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

EmojiRotationMonitor.displayName = 'EmojiRotationMonitor'
