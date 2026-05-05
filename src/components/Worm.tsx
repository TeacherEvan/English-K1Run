import { memo, useMemo } from 'react';
import { UI_LAYER_MATRIX } from '../lib/constants/ui-layer-matrix';
import { multiTouchHandler } from '../lib/touch-handler';
import type { WormObject } from '../types/game';
import './WormLoadingScreen.css'; // Reuse existing wiggle animation

interface WormProps {
  worm: WormObject
  onTap: (wormId: string, playerSide: 'left' | 'right') => void
  playerSide: 'left' | 'right'
}

const WORM_SIZE = 60

export const Worm = memo(({ worm, onTap, playerSide }: WormProps) => {
  const activateWorm = () => {
    onTap(worm.id, playerSide)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shouldProcess = multiTouchHandler.handleMouseClick(worm.id)
    if (shouldProcess) {
      activateWorm()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    multiTouchHandler.handleTouchStart(e.nativeEvent, worm.id)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const shouldProcess = multiTouchHandler.handleTouchEnd(e.nativeEvent, worm.id)
    if (shouldProcess) {
      activateWorm()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    activateWorm()
  }

  const wormStyle = useMemo(() => ({
    left: `${worm.x}%`,
    top: `${worm.y}px`,
    fontSize: `${WORM_SIZE}px`,
    transform: `translate(-50%, -50%) rotate(${worm.angle}rad) scale(var(--object-scale, 1))`,
    zIndex: UI_LAYER_MATRIX.GAMEPLAY_HAZARDS
  }), [worm.x, worm.y, worm.angle])

  if (!worm.alive) return null

  return (
    <div
      data-testid="worm"
      data-worm-id={worm.id}
      className="absolute cursor-pointer select-none transition-opacity duration-200"
      style={wormStyle}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Tap worm"
      tabIndex={0}
    >
      <div className="worm-wiggle">
        🐛
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.worm.id === nextProps.worm.id &&
    prevProps.worm.x === nextProps.worm.x &&
    prevProps.worm.y === nextProps.worm.y &&
    prevProps.worm.alive === nextProps.worm.alive &&
    prevProps.worm.angle === nextProps.worm.angle &&
    prevProps.playerSide === nextProps.playerSide
  )
})

Worm.displayName = 'Worm'
