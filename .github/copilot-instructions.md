# Copilot Instructions for Kindergarten Race Game

## Project Overview
This is a **split-screen educational racing game** built with React 19 + TypeScript + Vite. Two players compete by correctly identifying falling objects to advance their turtle characters. The game is optimized for tablets and touch devices in educational settings.

## Architecture Patterns

### Core Game Loop
- **Game state management**: `src/hooks/use-game-logic.ts` contains all game logic with `gameObjects[]`, `GameState`, and `GAME_CATEGORIES`
- **Display adaptation**: `src/hooks/use-display-adjustment.ts` handles responsive scaling across devices
- **Split-screen design**: Objects spawn on left/right sides (x <= 50 vs x > 50) for dual player areas

### Component Structure
- **Game components**: All in `src/components/` with clear interfaces (e.g., `PlayerAreaProps`, `FallingObjectProps`)
- **UI primitives**: Radix UI components in `src/components/ui/` using class-variance-authority patterns
- **Memory optimization**: Components use `memo()` for performance (see `PlayerArea.tsx`)

### State & Performance
- **Event tracking**: `src/lib/event-tracker.ts` monitors errors, performance, and user actions globally
- **Performance monitoring**: Built-in FPS tracking, memory monitoring, and touch latency measurement
- **CSS Variables**: Dynamic scaling via CSS custom properties (`--font-scale`, `--spacing-scale`, etc.)

## Development Workflows

### Running the Game
```bash
# Development (hot reload)
npm run dev  # Vite dev server on port 5173

# Docker development (recommended for testing)
docker-compose --profile dev up kindergarten-race-dev

# Production build
npm run build  # Requires TypeScript compilation with --noCheck flag
```

### Key Build Considerations
- **TypeScript**: Uses `tsc -b --noCheck` due to React 19 compatibility
- **Vite config**: Includes alias `@` → `src/`, disabled FS strict mode, cache control headers
- **Docker**: Multi-stage builds with nginx for production, dev container with hot reload

## Project-Specific Conventions

### Component Props Pattern
```typescript
interface ComponentProps {
  // Always define explicit interfaces for props
  playerNumber: 1 | 2  // Use literal types for constrained values
  progress: number
  isWinner: boolean
}
export const Component = memo(({ prop1, prop2 }: ComponentProps) => {
  // Use memo() for components that render frequently
})
```

### Game Object Management
- **Categories**: Educational content in `GAME_CATEGORIES` (Fruits, Numbers, Alphabet)
- **Object spawning**: Random position/speed generation with performance tracking
- **Target system**: Dynamic target changes with countdown timers and sequence modes

### Responsive Design Philosophy
- **Base dimensions**: Designed for 1920x1080, scales down proportionally
- **Touch optimization**: Large touch targets, optimized for tablet use
- **CSS scaling**: All dimensions use calc() with CSS variables for consistent scaling

### Performance Requirements
- **60fps target**: Game loop optimized for smooth animations
- **Memory management**: Object cleanup, event limiting (max 1000 tracked events)
- **Touch latency**: Monitored and optimized for educational tablet use

## Key Integration Points
- **Tailwind + Radix**: Custom color system with CSS variables from `theme.json`
- **Event system**: Global error/performance tracking affects debugging workflow
- **Docker deployment**: nginx serves static assets, environment-specific configurations

## Common Patterns to Follow
- Use `useCallback` for event handlers passed to child components
- Implement proper cleanup in `useEffect` for intervals/timers
- Follow the existing scaling system when adding new UI elements
- Add new educational categories by extending `GAME_CATEGORIES`
- Use the event tracker for debugging and performance monitoring