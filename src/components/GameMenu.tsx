// import { ArrowLeft, Check, Info, LogOut, Play, Settings, Trophy } from 'lucide-react'
const ArrowLeft = () => <span>←</span>
const Check = () => <span>✓</span>
const Info = () => <span>ℹ️</span>
const LogOut = () => <span>🚪</span>
const Play = () => <span>▶️</span>
const Settings = () => <span>⚙️</span>
const Trophy = () => <span>🏆</span>
import { memo, useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { LanguageSelector } from './ui/language-selector'

interface GameMenuProps {
  onStartGame: () => void
  onSelectLevel: (levelIndex: number) => void
  selectedLevel: number
  levels: string[]
  gameStarted: boolean
  winner: boolean
  initialView?: 'main' | 'levels'
  continuousMode?: boolean
  onToggleContinuousMode?: (enabled: boolean) => void
  onResetGame?: () => void
  bestTime?: number
}

/**
 * GameMenu - Overhauled Homescreen (Dec 2025)
 * 
 * Features:
 * - "Homescreen" layout with main actions
 * - "New Game" -> Level Selection
 * - "Best Times" -> Digital Stopwatch Display
 * - "Settings" -> Modal with Continuous Mode toggle
 * - "Credits" -> Modal with attribution
 * - "Exit Game" -> Close window action
 * - Thai translations for all main actions
 */
export const GameMenu = memo(({
  onStartGame,
  onSelectLevel,
  selectedLevel,
  levels,
  gameStarted,
  winner,
  initialView = 'main',
  continuousMode = false,
  onToggleContinuousMode,
  onResetGame,
  bestTime = 0
}: GameMenuProps) => {
  console.log('DEBUG: GameMenu rendering'); const [view, setView] = useState<'main' | 'levels'>(initialView)
  const [showExitDialog, setShowExitDialog] = useState(false)

  if (gameStarted && !winner) return null

  // Format time helper
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const tenths = Math.floor((ms % 1000) / 100)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`
  }

  const handleExit = () => {
    setShowExitDialog(true)
  }

  const confirmExit = () => {
    setShowExitDialog(false)
    // Reset game state before exit to ensure clean shutdown
    onResetGame?.()
    // Attempt to close the window
    try {
      window.close()
    } catch {
      // Fallback: if browser blocks close, state is still reset from above
      console.log('[GameMenu] window.close() blocked by browser')
    }
  }

  // Main Homescreen View
  if (view === 'main') {
    return (
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
        data-testid="game-menu"
      >
        <Card className="w-full max-w-4xl mx-4 p-8 bg-card/50 border-4 border-primary/20 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

            {/* Left Column: Title & Mascot */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="text-8xl animate-bounce cursor-default select-none">
                🐢
              </div>
              <div>
                <h1
                  className="text-5xl font-bold text-primary mb-2 tracking-tight"
                  data-testid="game-title"
                >
                  Kindergarten Race
                </h1>
                <h2 className="text-3xl font-semibold text-primary/80 font-thai">
                  การแข่งขันอนุบาล
                </h2>
              </div>

              {/* Best Times Display */}
              <div className="mt-8 p-6 bg-black/80 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] w-full max-w-xs transform hover:scale-105 transition-transform duration-300">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">
                      Best Time / เวลาที่ดีที่สุด
                    </span>
                  </div>
                  <div className="text-4xl font-mono font-bold text-yellow-400 animate-pulse" style={{ textShadow: '0 0 20px rgba(234,179,8,0.6)' }}>
                    {formatTime(bestTime)}
                  </div>
                  {continuousMode && (
                    <div className="mt-2 text-xs text-white/60">
                      Continuous Mode Record
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Menu Actions */}
            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">

              <Button
                size="lg"
                className="h-20 text-2xl font-bold shadow-lg hover:scale-105 transition-all duration-200 gap-4"
                onClick={() => setView('levels')}
                data-testid="new-game-button"
              >
                <Play className="w-8 h-8 fill-current" />
                <div className="flex flex-col items-start">
                  <span>New Game</span>
                  <span className="text-sm font-normal opacity-90">เกมใหม่</span>
                </div>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 text-xl font-semibold justify-start px-8 gap-4 hover:bg-primary/10"
                    data-testid="settings-button"
                  >
                    <Settings className="w-6 h-6" />
                    <div className="flex flex-col items-start">
                      <span>Settings</span>
                      <span className="text-xs font-normal opacity-70">การตั้งค่า</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <Settings className="w-6 h-6" />
                      Settings / การตั้งค่า
                    </DialogTitle>
                    <DialogDescription>
                      Configure your game experience
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-6">
                    <div className="flex flex-col gap-4 p-4 rounded-lg border bg-card/50">
                      <div>
                        <h4 className="font-medium leading-none mb-3">Language</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Select gameplay language and voiceovers
                        </p>
                        <LanguageSelector
                          showLabel={false}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                      <div className="space-y-1">
                        <h4 className="font-medium leading-none">Continuous Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Play without winning/stopping
                        </p>
                      </div>
                      <Button
                        variant={continuousMode ? "default" : "outline"}
                        onClick={() => onToggleContinuousMode?.(!continuousMode)}
                        className={continuousMode ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {continuousMode ? <Check className="w-4 h-4 mr-2" /> : null}
                        {continuousMode ? "On" : "Off"}
                      </Button>
                    </div>
                    {/* Placeholder for Audio Settings */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50 opacity-50 cursor-not-allowed">
                      <div className="space-y-1">
                        <h4 className="font-medium leading-none">Audio Volume</h4>
                        <p className="text-sm text-muted-foreground">
                          Managed by device
                        </p>
                      </div>
                      <Button variant="outline" disabled>Max</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 text-xl font-semibold justify-start px-8 gap-4 hover:bg-primary/10"
                    data-testid="credits-button"
                  >
                    <Info className="w-6 h-6" />
                    <div className="flex flex-col items-start">
                      <span>Credits</span>
                      <span className="text-xs font-normal opacity-70">เครดิต</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <Info className="w-6 h-6" />
                      Credits / เครดิต
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-8 text-center space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground uppercase tracking-widest">Created By</p>
                      <h3 className="text-2xl font-bold text-primary">TEACHER EVAN</h3>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground uppercase tracking-widest">In Association With</p>
                      <h3 className="text-xl font-bold text-orange-500">SANGSOM KINDERGARTEN</h3>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm font-semibold mb-2">SPECIAL THANKS TO</p>
                      <p className="text-lg">TEACHER MIKE AND TEACHER LEE</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="destructive"
                size="lg"
                className="h-16 text-xl font-semibold justify-start px-8 gap-4 mt-4"
                onClick={handleExit}
                data-testid="exit-button"
              >
                <LogOut className="w-6 h-6" />
                <div className="flex flex-col items-start">
                  <span>Exit Game</span>
                  <span className="text-xs font-normal opacity-70">ออกจากเกม</span>
                </div>
              </Button>

              {/* Exit Confirmation Dialog */}
              <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <LogOut className="w-6 h-6 text-destructive" />
                      Exit Game / ออกจากเกม
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to exit? / คุณแน่ใจหรือไม่ว่าต้องการออก?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-4 justify-end mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowExitDialog(false)}
                    >
                      Cancel / ยกเลิก
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmExit}
                    >
                      Exit / ออก
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Level Selection View
  const thaiTranslations = [
    'ผลไม้และผัก',           // Fruits & Vegetables
    'สนุกกับการนับ',          // Counting Fun
    'รูปร่างและสี',          // Shapes & Colors
    'สัตว์และธรรมชาติ',       // Animals & Nature
    'ยานพาหนะ',              // Things That Go
    'สภาพอากาศ',             // Weather Wonders
    'ความรู้สึกและการกระทำ',  // Feelings & Actions
    'ส่วนต่างๆของร่างกาย',     // Body Parts
    'ความท้าทายด้วยตัวอักษร'    // Alphabet Challenge
  ]

  return (
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in slide-in-from-right-8 duration-300"
      data-testid="level-select-menu"
    >
      <Card className="w-full max-w-5xl mx-4 bg-card/90 border-4 border-primary/20 shadow-2xl h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setView('main')}
            className="gap-2 text-xl"
            data-testid="back-to-menu-button"
          >
            <ArrowLeft className="w-6 h-6" />
            Back / กลับ
          </Button>
          <h2 className="text-4xl font-bold text-primary">Select Level / เลือกระดับ</h2>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto px-8 py-4 flex-1">
          {levels.map((level, index) => (
            <Button
              key={level}
              variant={selectedLevel === index ? "default" : "outline"}
              className={`h-32 text-xl font-bold flex flex-col gap-2 transition-all hover:scale-105 ${selectedLevel === index
                ? 'bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/30'
                : 'hover:border-primary/50'
                }`}
              onClick={() => onSelectLevel(index)}
              data-testid="level-button"
              data-selected={selectedLevel === index}
            >
              <span className="text-4xl mb-1">
                {index === 0 ? '🍎' :
                  index === 1 ? '1️⃣' :
                    index === 2 ? '🎨' :
                      index === 3 ? '🦁' :
                        index === 4 ? '🚗' :
                          index === 5 ? '🌤️' :
                            index === 6 ? '😄' :
                              index === 7 ? '🖐️' :
                                index === 8 ? '🅰️' : '🎮'}
              </span>
              <div className="flex flex-col items-center">
                <span className="text-center px-2 leading-tight">{level}</span>
                <span className="text-xs text-gray-400 mt-1">{thaiTranslations[index] || ''}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 flex justify-center">
          <Button
            size="lg"
            className="w-full max-w-md h-20 text-3xl font-bold shadow-xl animate-pulse hover:animate-none hover:scale-105 transition-transform"
            onClick={onStartGame}
            data-testid="start-button"
          >
            START GAME / เริ่มเกม
          </Button>
        </div>
      </Card>
    </div>
  )
})
