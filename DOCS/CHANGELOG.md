# Changelog - Kindergarten Race Game

This file consolidates major changes, bug fixes, and enhancements made to the project.

## November 2025 - Visual Enhancements

### Background Expansion (Nov 26, 2025)

- **5 New Backgrounds Added**: Doubled variety from 5 to 10 rotating backgrounds
  - 🌌 `nebula-galaxy` - Colorful cosmic nebula (287 KB)
  - 🌿 `tropical-waterfall` - Lush jungle waterfall (380 KB)
  - 🏛️ `colorful-buildings` - Burano Italy pastels (375 KB)
  - 🌸 `cherry-blossom` - Pink cherry blossoms (194 KB)
  - 🎨 `starry-art` - Abstract art gallery (557 KB)
- **Categories Covered**: Galaxy/Space, Nature, Architecture, Art
- **Optimized File Sizes**: All images 194-557 KB (average 359 KB)
- **Consistent CSS Patterns**: Follows existing overlay and z-index conventions
- **Documentation**: Added `DOCS/BACKGROUND_EXPANSION_NOV2025.md`

## October 2025 - Performance Optimization & Code Quality

### Performance Improvements (Oct 15, 2025)

- **Spawn Rate**: Reduced from 1400ms to 2000ms (30% fewer objects)
- **Animation Loop**: Migrated from setInterval to requestAnimationFrame for smoother 60fps
- **Timer Updates**: Reduced from 100ms to 1000ms (90% fewer re-renders)
- **Background Timer**: Now only runs on menu screens (paused during gameplay)
- **Event Memory**: Reduced from 1000 to 500 max events (50% savings)
- **Console Logging**: Now dev-only (0% production overhead)
- **Result**: +10-15 FPS improvement, 30% CPU reduction, 20-25% memory savings

### Bug Fixes (Oct 2025)

- **Collision Detection**: Fixed physics-based collision with proper bidirectional forces
- **Emoji Side-Switching**: Objects now maintain consistent lane boundaries throughout lifecycle
- **Overlapping Audio**: Removed duplicate sound effects, kept only voice pronunciations
- **Event Listener Cleanup**: Fixed memory leak with anonymous touchstart handler
- **Winner Display**: Fixed boolean display bug showing "YOU WIN!" correctly

### Feature Enhancements (Oct 2025)

- **Sentence Templates**: Added 135 comprehensive educational sentence templates (100% coverage)
- **Immediate Target Spawn**: 2 target emojis spawn immediately when target changes
- **Emoji Rotation System**: 10-second threshold prevents same emoji from appearing too frequently
- **Multi-Touch Support**: Advanced touch validation for QBoard displays and tablets

### Code Quality (Oct 2025)

- **Security**: Removed exposed API keys, added environment variable pattern
- **Unused Code**: Removed 3 unused debug components and analytics library
- **Documentation**: Consolidated 28 markdown files into essential documentation
- **Build Optimization**: Removed unused dependencies, improved bundle size

## Earlier 2025 - Foundation & Core Features

### Core Game Features

- Split-screen racing game with dual player support
- 9 educational categories (Fruits, Numbers, Alphabet, Colors, Animals, etc.)
- 121 total game items with audio pronunciations
- Progress tracking, winner detection, combo celebrations
- Responsive design for tablets, mobile, and QBoard displays

### Audio System

- 190+ .wav files for professional pronunciations
- Multi-tier fallback (wav → HTMLAudio → Speech Synthesis → tones)
- Web Audio API with AudioContext management
- ElevenLabs voice generation scripts

### Performance Features

- 60fps target with requestAnimationFrame
- Max 15-30 concurrent objects
- Physics-based collision detection
- Lane-specific boundary management
- Comprehensive event tracking and monitoring

### Deployment

- Vercel production deployment
- Docker with nginx for containerized deployment
- Support for Android/Termux development environments
- Proper CORS and MIME type headers

## Development Tools

### Build System

- React 19 + TypeScript 5.9 + Vite 7.1
- Tailwind CSS 4.1 with custom color system
- Radix UI components with CVA patterns
- ESLint with TypeScript support

### Testing & Monitoring

- Performance Monitor for FPS tracking
- Event Tracker for error logging
- Touch Handler Debug for multi-touch validation
- Quick Debug for CSS variable inspection

## Known Issues & Limitations

### Current Limitations

- React 19 types still evolving (using --noCheck flag)
- Some lint warnings for UI component exports (acceptable)
- Node.js 20.18+ or 22.12+ required (Vite 7 dependency)

### Browser Compatibility

- Optimized for Chrome, Firefox, Safari
- Special handling for BenQ interactive displays
- QBoard touch interference prevention

## Future Enhancements

### Planned Features

- Sentence variations (2-3 options per item)
- Multilingual support
- Custom teacher templates
- Difficulty levels based on student age
- Analytics dashboard for tracking student progress

### Potential Optimizations

- Object pooling for extreme performance needs
- Web Workers for collision detection with 20+ objects
- Canvas rendering alternative if needed

---

For detailed technical documentation, see:

- `README.md` - Setup and deployment guide
- `.github/copilot-instructions.md` - Comprehensive development guide
- `PERFORMANCE_OPTIMIZATION_OCT2025.md` - Detailed performance audit
- `MULTI_TOUCH_IMPLEMENTATION.md` - Touch handling system
- `VERCEL_AUDIO_DEBUG.md` - Audio troubleshooting guide
