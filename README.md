# English K1 Run (`English-K1Run`) 🎮🎓

An educational racing game where kindergarten students (ages 4-6) learn pattern recognition, letters, numbers, and vocabulary through interactive gameplay. Built with modern web technologies for tablets and interactive displays.

Current public-facing product name: **English K1 Run**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌟 Features

- **9 Educational Categories**: Fruits & Vegetables, Counting, Alphabet, Shapes & Colors, Animals & Nature, Things That Go, Weather Wonders, Feelings & Actions, Body Parts
- **121 Game Items**: Each with professional audio pronunciations
- **Single-Player Mode**: Optimized for kindergarten classroom use
- **Continuous Mode**: Auto-advancing levels for extended play sessions
- **Touch-Optimized**: Designed for tablets and QBoard interactive displays
- **Deterministic Welcome Screen**: explicit-tap narration start, visible continue CTA, and E2E-safe bypass behavior
- **Accessibility**: WCAG 2.3.3 AAA compliant with `prefers-reduced-motion` support
- **Progressive Loading**: Smart audio preloading for smooth gameplay
- **Offline Support**: PWA-enabled for classroom reliability

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.18+ or 22.12+ (Vite 7 requirement)
- **npm** or **yarn**
- Modern browser (Chrome, Firefox, Safari, Edge)
- **(Optional) ElevenLabs API Key**: For high-quality voice audio (see [Audio Setup Guide](AUDIO_SETUP.md))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/English-K1Run.git
cd English-K1Run

# Install dependencies
npm install

# (Optional) Configure audio - see AUDIO_SETUP.md for details
cp .env.example .env
# Edit .env and add your VITE_ELEVENLABS_API_KEY

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

> **Note**: The game will work without ElevenLabs API key but will use fallback browser speech/audio behavior. For high-quality natural voice, see [AUDIO_SETUP.md](AUDIO_SETUP.md).

### Development Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run verify           # Lint + typecheck + build (run before commits)

# Testing
npm run test             # Vitest watch mode
npm run test:run         # CI mode (single run)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # E2E tests with UI
npm run test:e2e:debug   # Debug E2E tests

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
code_review.ps1          # Automated code review (runs every 5 minutes via Task Scheduler)

# Dependencies
npm run requirements     # Generate REQUIREMENTS.txt (all dependencies)
npm run requirements:md  # Generate DEPENDENCIES.md (markdown format)
npm run requirements:json # Generate requirements.json (JSON format)
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19.2 + TypeScript 5.9
- **Build Tool**: Vite 7.1
- **Styling**: Tailwind CSS 4.1 + Radix UI
- **Audio**: Web Audio API with progressive loading
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Vercel (primary), Docker/nginx

### Project Structure

```text
English-K1Run/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn-style UI primitives
│   │   ├── Welcome/        # Welcome screen components
│   │   ├── FallingObject.tsx
│   │   ├── GameMenu.tsx
│   │   └── PlayerArea.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── use-game-logic.ts    # Core game state (1878 lines)
│   │   ├── use-display-adjustment.ts
│   │   └── use-language.ts
│   ├── lib/                # Utilities and services
│   │   ├── audio/          # Audio system modules
│   │   ├── constants/      # Game configuration
│   │   ├── event-metrics/  # Analytics tracking
│   │   ├── game/           # Game logic modules
│   │   ├── sound-manager.ts     # Audio manager (1616 lines)
│   │   ├── event-tracker.ts     # Error tracking
│   │   └── touch-handler.ts     # Multi-touch support
│   ├── types/              # TypeScript definitions
│   ├── locales/            # i18n translations
│   └── styles/             # Global styles
├── public/
│   ├── sounds/             # 190+ audio files (.wav, .mp3)
│   ├── backgrounds/        # 10 rotating backgrounds
│   └── manifest.json       # PWA manifest
├── e2e/                    # Playwright E2E tests
├── DOCS/                   # Documentation
└── scripts/                # Build and utility scripts
```

### Key Components

#### Core Game Logic ([`use-game-logic.ts`](src/hooks/use-game-logic.ts))

- **Single source of truth** for all game state
- Manages falling objects, worms, progress tracking
- Handles collision detection and physics
- Implements combo system and achievements
- **1878 lines** - scheduled for refactoring

#### Sound Manager ([`sound-manager.ts`](src/lib/sound-manager.ts))

- Web Audio API with HTMLAudio fallback
- Progressive loading (Critical → Common → Rare)
- Speech synthesis integration
- Multi-language support
- **1616 lines** - scheduled for modularization

#### Event Tracker ([`event-tracker.ts`](src/lib/event-tracker.ts))

- Global error handling
- Performance monitoring
- Audio playback tracking
- Emoji lifecycle tracking

## 🎮 Gameplay

### Game Modes

#### Standard Mode

- Select a category (Fruits, Numbers, Alphabet, etc.)
- Tap falling emojis that match the target
- Progress bar fills with correct taps
- Win at 100% progress

#### Continuous Mode

- Auto-advances through all categories
- Tracks completion time
- High score system
- Ideal for extended play sessions

### Educational Categories

1. **Fruits & Vegetables** (13 items) - Apple, Banana, Grapes, etc.
2. **Counting Fun** (15 items) - Numbers 1-15 with emoji
3. **Alphabet Challenge** (26 items) - Sequential A→Z
4. **Shapes & Colors** (13 items) - Circle, Triangle, Star, etc.
5. **Animals & Nature** (13 items) - Dog, Cat, Fox, Turtle, etc.
6. **Things That Go** (13 items) - Car, Bus, Airplane, Rocket, etc.
7. **Weather Wonders** (10 items) - Sunny, Cloudy, Rainy, Rainbow, etc.

### Controls

- **Touch/Click**: Tap falling objects
- **Keyboard**:
  - `Enter`/`Space`: Start game, continue
  - `Escape`: Back to menu
  - `Ctrl+D` / `Cmd+D`: Toggle debug overlays

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/specs/gameplay.spec.ts

# Run with UI for debugging
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

**Test Coverage:**

- ✅ Accessibility (ARIA, keyboard navigation)

Note: A migration of core utility functions and integrations was performed (Jan 2026).
See `DOCS/INTEGRATION_GUIDE.md` for the migration checklist and details about the updated utilities (clamp → `calculatePercentageWithinBounds`, ID generation → `generateUniqueIdentifier`, Fisher–Yates → `transformArrayToRandomOrder`, resource preloader, accessibility focus/announcements, and performance monitoring).

- ✅ Gameplay mechanics (object spawning, tapping, progress)
- ✅ Menu navigation (level selection, settings)
- ✅ Touch interactions (multi-touch, QBoard compatibility)
- ✅ Deployment diagnostics (production checks)
- ✅ Cross-browser compatibility (Chromium, Firefox, WebKit, Edge)
- ✅ Mobile/tablet responsiveness (iPad Pro 11, Pixel 7)
- ✅ CI/CD integration with sharding and parallel execution

### Unit Tests (Vitest)

```bash
# Run unit tests in watch mode
npm run test

# Run once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

**Current Coverage:**

- ✅ Sound manager audio calls
- ✅ Optimistic UI updates
- ✅ Performance profiler
- ✅ Spawn position calculations
- ⚠️ **TODO**: Core game logic tests needed

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

**Environment Variables:**

- `VITE_AUDIO_SPRITE_ENABLED`: Enable audio sprite optimization (optional)
- `VITE_AUDIO_SPRITE_URL`: Audio sprite file URL
- `VITE_AUDIO_SPRITE_MANIFEST_URL`: Sprite manifest URL

### Docker

```bash
# Build Docker image
docker build -t kindergarten-race .

# Run container
docker run -p 80:80 kindergarten-race

# Or use docker-compose
docker-compose up
```

**Docker Features:**

- Multi-stage build for optimized image size
- Nginx with SPA routing
- Health checks
- Gzip compression
- Security headers

### Manual Build

```bash
# Build for production
npm run build

# Preview build locally
npm run preview

# Deploy dist/ folder to any static host
```

## ⚙️ Configuration

### Game Configuration ([`lib/constants/game-config.ts`](src/lib/constants/game-config.ts))

```typescript
export const MAX_ACTIVE_OBJECTS = 30; // Max falling objects
export const SPAWN_COUNT = 8; // Objects per spawn
export const SPAWN_INTERVAL = 1500; // Spawn every 1.5s
export const TARGET_GUARANTEE_COUNT = 2; // Min target emojis
export const EMOJI_SIZE = 80; // Object size in pixels
```

### Audio Configuration

```typescript
// Progressive loading priorities
AudioPriority.CRITICAL; // Welcome screen, UI sounds
AudioPriority.COMMON; // Numbers 1-10, letters, basic words
AudioPriority.RARE; // Weather, vehicles, complex words
```

### Display Adjustment

Automatically scales for different screen sizes:

- **Base Design**: 1920x1080
- **CSS Variables**: `--font-scale`, `--object-scale`, `--spacing-scale`
- **Responsive**: Tablets, mobile, QBoard displays

## ♿ Accessibility

### WCAG 2.1 AA Compliance

- ✅ Keyboard navigation
- ✅ Screen reader support (ARIA labels)
- ✅ Focus management
- ✅ High contrast mode
- ✅ Reduced motion support
- ✅ Touch-first design (no hover states)

### Customizable Settings

```typescript
// Accessibility preferences
{
  animationSpeed: 1.0,        // 0.1 - 3.0
  highContrast: false,        // Enhanced contrast
  reducedMotion: false,       // Minimal animations
  simplifiedMode: false,      // Reduced complexity
  focusIndicatorSize: 'normal' // small | normal | large
}
```

### Kindergarten Optimizations

- **Large tap targets**: 80px minimum
- **Clear visual feedback**: Immediate response
- **Simple instructions**: Voice guidance
- **Forgiving gameplay**: No penalties for mistakes
- **Celebration animations**: Positive reinforcement

## 🌍 Internationalization

### Supported Languages

- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇯🇵 Japanese (ja)
- 🇹🇭 Thai (th)
- 🇨🇳 Mandarin Chinese (zh-CN)
- 🇭🇰 Cantonese (zh-HK)

### Adding Translations

1. Add translation file: `src/locales/{lang}.json`
2. Update language config: `src/lib/constants/language-config.ts`
3. Add sentence templates: `src/lib/constants/sentence-templates.ts`
4. Generate audio files: `npm run audio:generate`

## 📊 Performance

### Optimization Strategies

- **Lazy Loading**: Non-critical components loaded on demand
- **Progressive Audio**: Priority-based audio loading
- **Memoization**: `useMemo`, `useCallback` for expensive operations
- **RequestAnimationFrame**: Smooth 60fps animations
- **Service Worker**: Offline caching with Workbox
- **Bundle Splitting**: Vendor chunks for better caching

### Performance Metrics

- **Target FPS**: 60fps gameplay
- **Bundle Size**: <1.5MB (React 19 core)
- **Initial Load**: <3s on 3G
- **Audio Loading**: Progressive (Critical → Common → Rare)
- **Memory Usage**: Stable with LRU cache (TODO)

### Known Optimizations (Oct 2025)

- ✅ Spawn rate reduced: 1400ms → 1500ms
- ✅ Timer updates: 100ms → 1000ms (90% fewer re-renders)
- ✅ Background rotation: Paused during gameplay
- ✅ Event buffer: 1000 → 500 max events
- ✅ Hover states removed: Touch-only interface
- **Result**: +10-15 FPS, 30% CPU reduction, 20-25% memory savings

## 🐛 Troubleshooting

### Common Issues

#### Audio not playing

```bash
# Check audio context state
console.log(soundManager.getDebugInfo())

# Verify audio files loaded
ls public/sounds/*.wav
```

#### Build fails with TypeScript errors

```bash
# Use --noCheck flag (React 19 types still evolving)
npm run build  # Already configured in package.json
```

#### E2E tests failing

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run in headed mode to debug
npm run test:e2e:headed
```

#### Docker build fails

```bash
# Use legacy peer deps for ARM64/Android
npm run install:android

# Or use safe install
npm run install:safe
```

### Debug Mode

Press `Ctrl+D` (Windows/Linux) or `Cmd+D` (Mac) during gameplay to toggle debug overlays:

- FPS monitor
- Event tracker
- CSS variable inspector
- Touch handler debug
- Emoji rotation monitor

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Run** quality checks: `npm run verify`
5. **Push** to branch: `git push origin feature/amazing-feature`
6. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Zero warnings required
- **Formatting**: Prettier (automatic)
- **Commits**: Conventional commits preferred
- **Tests**: E2E tests for new features

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings from `npm run verify`
- [ ] E2E tests pass
- [ ] Tested on tablet/touch device

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team**: For React 19 and excellent documentation
- **Vite Team**: For blazing-fast build tool
- **Radix UI**: For accessible component primitives
- **Tailwind CSS**: For utility-first styling
- **Playwright**: For reliable E2E testing
- **ElevenLabs**: For high-quality voice generation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/English-K1Run/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/English-K1Run/discussions)
- **Email**: [support@example.com](mailto:support@example.com)

## 🗺️ Roadmap

### Completed ✅

- [x] React 19 migration
- [x] TypeScript 5.9 upgrade
- [x] Vite 7 migration
- [x] Progressive audio loading
- [x] E2E test suite
- [x] PWA support
- [x] Accessibility features

### In Progress 🚧

- [ ] Unit test coverage for core logic
- [ ] LRU cache for audio buffers
- [ ] Sound manager modularization
- [ ] CI/CD pipeline completion

### Planned 📋

- [ ] Visual regression tests
- [ ] Feature flags system
- [ ] Performance budgets
- [ ] Multi-language sentence templates
- [ ] Teacher dashboard
- [ ] Student progress tracking
- [ ] Custom category creation

---

### Made with ❤️ for kindergarten education

Last Updated: January 2026
