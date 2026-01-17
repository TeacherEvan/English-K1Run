import { memo, useMemo, useState } from 'react'
import { useSettings, type ResolutionScale } from '../context/settings-context'
import { GAME_CATEGORIES } from '../lib/constants/game-categories'
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

// --- SVG Icons Components (Replaces Lucide dependency to ensure zero-dependency) ---
// Using clear, accessible SVG paths

const PlayIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8 5v14l11-7z" />
  </svg>
)

const GridIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const SettingsIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const InfoIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
)

const LogOutIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const ArrowLeftIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const CheckIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const TrophyIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
)

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

// Translations map for level categories
// Keeping this outside component to avoid recreation
const THAI_TRANSLATIONS = [
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

/**
 * GameMenu - Overhauled Homescreen (Dec 2025)
 * 
 * Features:
 * - Responsive "Homescreen" layout
 * - Interactive Level Grid with Dynamic Icons
 * - SVGs for all UI elements
 * - Accessible Dialogs for Settings/Credits
 * - Mobile-first grid adaptations
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
  // Debug log to trace render cycles
  if (import.meta.env.DEV) {
    console.log('[GameMenu] rendering view:', initialView)
  }

  // Extract current display resolution scale and updater from settings context
  const {
    resolutionScale,
    setResolutionScale
  } = useSettings()

  // TODO: [OPTIMIZATION] Consider memoizing settings options array if scale options become dynamic

  const [view, setView] = useState<'main' | 'levels'>(initialView)
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Memoize time formatting
  const formattedBestTime = useMemo(() => {
    const ms = bestTime
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const tenths = Math.floor((ms % 1000) / 100)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`
  }, [bestTime])

  if (gameStarted && !winner) return null

  const handleExit = () => {
    setShowExitDialog(true)
  }

  const confirmExit = () => {
    setShowExitDialog(false)
    onResetGame?.()
    try {
      window.close()
    } catch {
      console.log('[GameMenu] window.close() blocked by browser')
    }
  }

  // Generate dynamic icons for levels based on GAME_CATEGORIES
  const getLevelIcon = (index: number) => {
    if (GAME_CATEGORIES[index]?.items?.length > 0) {
      return GAME_CATEGORIES[index].items[0].emoji
    }
    // Fallback icons if category data missing
    const fallbacks = ['🍎', '1️⃣', '🎨', '🦁', '🚗', '🌤️', '😄', '🖐️', '🅰️']
    return fallbacks[index] || '🎮'
  }

  // --- Main Homescreen View ---
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
              <div className="text-8xl animate-bounce cursor-default select-none filter drop-shadow-lg">
                🐢
              </div>
              <div className="space-y-2">
                <h1
                  className="text-4xl md:text-5xl font-bold text-primary tracking-tight drop-shadow-sm"
                  data-testid="game-title"
                >
                  Kindergarten Race
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-primary/80 font-thai">
                  การแข่งขันอนุบาล
                </h2>
              </div>

              {/* Best Times Display */}
              <div className="mt-8 p-6 bg-black/80 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] w-full max-w-xs transform hover:scale-105 transition-transform duration-300 group">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform" />
                    <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">
                      Best Time
                    </span>
                  </div>
                  <div className="text-4xl font-mono font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors" style={{ textShadow: '0 0 20px rgba(234,179,8,0.6)' }}>
                    {formattedBestTime}
                  </div>
                  {continuousMode && (
                    <div className="mt-2 text-xs text-white/60 bg-green-900/50 px-2 py-1 rounded-full border border-green-500/30">
                      Continuous Mode
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Menu Actions */}
            <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
              {/* 1. START GAME Button */}
              <Button
                size="lg"
                className="h-20 text-2xl font-bold shadow-lg hover:scale-105 hover:shadow-primary/25 transition-all duration-200 gap-4 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onStartGame()}
                data-testid="start-game-button"
                aria-label="Start Game Immediately"
              >
                <div className="p-2 bg-white/20 rounded-full">
                  <PlayIcon className="w-6 h-6 fill-current" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span>Start Game</span>
                  <span className="text-xs font-normal opacity-90 font-thai mt-1">เริ่มเกม</span>
                </div>
              </Button>

              {/* 2. LEVEL SELECT Button */}
              <Button
                variant="default"
                size="lg"
                className="h-16 text-xl font-bold shadow-md hover:scale-105 transition-all duration-200 gap-4"
                onClick={() => setView('levels')}
                data-testid="level-select-button"
                aria-label="Go to Level Selection"
              >
                <GridIcon className="w-6 h-6" />
                <div className="flex flex-col items-start leading-none">
                  <span>Level Select</span>
                  <span className="text-xs font-normal opacity-90 font-thai mt-1">เลือกระดับ</span>
                </div>
              </Button>

              {/* 3. SETTINGS Button (includes Language) */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 text-xl font-semibold justify-start px-8 gap-4 hover:bg-primary/5 border-2"
                    data-testid="settings-button"
                  >
                    <SettingsIcon className="w-6 h-6 text-primary" />
                    <div className="flex flex-col items-start leading-none">
                      <span>Settings</span>
                      <span className="text-xs font-normal opacity-70 font-thai mt-1">การตั้งค่า</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <SettingsIcon className="w-6 h-6" />
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
                    <div className="flex flex-col gap-3 p-4 rounded-lg border bg-card/50">
                      <div>
                        <h4 className="font-medium leading-none mb-2">Display Scale</h4>
                        <p className="text-sm text-muted-foreground">
                          Adjust UI size for your screen
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'auto', label: 'Auto' },
                          { id: 'small', label: 'Small' },
                          { id: 'medium', label: 'Medium' },
                          { id: 'large', label: 'Large' }
                        ].map(option => (
                          <Button
                            key={option.id}
                            variant={resolutionScale === option.id ? 'default' : 'outline'}
                            onClick={() => updateDisplayScale(option.id as ResolutionScale)}
                            aria-pressed={resolutionScale === option.id}
                          >
                            {option.label}
                          </Button>
                        ))}
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
                        aria-pressed={continuousMode}
                      >
                        {continuousMode ? <CheckIcon className="w-4 h-4 mr-2" /> : null}
                        {continuousMode ? "On" : "Off"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 4. EXIT Button */}
              <Button
                variant="destructive"
                size="lg"
                className="h-14 text-lg font-semibold justify-start px-8 gap-4 mt-2"
                onClick={handleExit}
                data-testid="exit-button"
              >
                <LogOutIcon className="w-5 h-5" />
                <div className="flex flex-col items-start leading-none">
                  <span>Exit</span>
                  <span className="text-xs font-normal opacity-70 font-thai mt-0.5">ออก</span>
                </div>
              </Button>

              {/* Credits (Small Link) */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="text-center mt-2">
                    <Button variant="link" size="sm" className="text-muted-foreground/60 h-auto p-0 text-xs">
                      Credits / เครดิต
                    </Button>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <InfoIcon className="w-6 h-6" />
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

              {/* Exit Confirmation Dialog */}
              <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2 text-destructive">
                      <LogOutIcon className="w-6 h-6" />
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
                      autoFocus
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

  // --- Level Selection View ---
  return (
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in slide-in-from-right-8 duration-300"
      data-testid="level-select-menu"
      role="dialog"
      aria-label="Level Selection Menu"
    >
      <Card className="w-full max-w-6xl mx-4 bg-card/95 border-4 border-primary/20 shadow-2xl h-[90vh] flex flex-col">
        {/* Header - Fixed properties */}
        <div className="flex items-center justify-between px-8 py-6 border-b bg-card rounded-t-xl shrink-0">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setView('main')}
            className="gap-2 text-xl hover:bg-primary/10"
            data-testid="back-to-menu-button"
            aria-label="Back to Main Menu"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <div className="flex flex-col items-start text-left">
              <span className="font-bold">Back</span>
              <span className="text-xs font-normal opacity-70 font-thai">กลับ</span>
            </div>
          </Button>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Select Level</h2>
            <h3 className="text-lg md:text-xl text-primary/70 font-thai">เลือกระดับ</h3>
          </div>
          {/* Spacer to balance the header visually */}
          <div className="w-32"></div>
        </div>

        {/* Level Grid - Scrollable Area */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {levels.map((level, index) => (
              <Button
                key={level}
                variant={selectedLevel === index ? "default" : "outline"}
                className={`h-40 xl:h-48 text-xl font-bold flex flex-col gap-3 transition-all duration-300 hover:scale-[1.03] active:scale-95 whitespace-normal ${selectedLevel === index
                  ? 'bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/30'
                  : 'hover:border-primary/50 hover:shadow-md bg-card'
                  }`}
                onClick={() => onSelectLevel(index)}
                data-testid="level-button"
                data-selected={selectedLevel === index}
              >
                <span className="text-5xl md:text-6xl mb-1 filter drop-shadow-sm">
                  {getLevelIcon(index)}
                </span>
                <div className="flex flex-col items-center w-full px-2">
                  <span className="text-center w-full truncate text-lg md:text-xl">{level}</span>
                  <span className="text-sm font-normal opacity-80 font-thai text-center w-full truncate mt-1">
                    {THAI_TRANSLATIONS[index] || ''}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Footer - Fixed properties */}
        <div className="px-8 py-6 border-t bg-card/50 rounded-b-xl flex justify-center shrink-0">
          <Button
            size="lg"
            className="w-full max-w-md h-20 text-3xl font-bold shadow-xl animate-pulse hover:animate-none hover:scale-105 transition-transform bg-gradient-to-r from-primary to-primary/80"
            onClick={onStartGame}
            data-testid="start-button"
            aria-label="Start Game with Selected Level"
          >
            START GAME / เริ่มเกม
          </Button>
        </div>
      </Card>
    </div>
  )
})
