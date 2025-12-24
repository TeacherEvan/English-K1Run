# Best Practices Guide - Kindergarten Race Game

**Version:** 1.0  
**Last Updated:** December 3, 2025  
**Target Audience:** Developers contributing to this project

---

## 🎯 Overview

This document outlines best practices for maintaining and extending the Kindergarten Race Game. Following these guidelines ensures code quality, performance, and maintainability.

---

## 📁 Project Structure

### Directory Organization

```
src/
├── components/         # React components
│   ├── ui/            # Reusable UI primitives (Shadcn style)
│   └── *.tsx          # Game-specific components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and core logic
│   ├── constants/     # Game configuration and data
│   └── utils/         # Helper functions
├── types/             # TypeScript type definitions
├── styles/            # Global CSS and themes
└── test/              # Test utilities and setup
```

### File Naming Conventions

- **Components:** PascalCase (e.g., `FallingObject.tsx`)
- **Hooks:** kebab-case with `use-` prefix (e.g., `use-game-logic.ts`)
- **Utilities:** kebab-case (e.g., `spawn-position.ts`)
- **Types:** PascalCase interfaces/types in `types/` directory
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_ACTIVE_OBJECTS`)

---

## 🎨 Component Best Practices

### Component Structure

```typescript
// 1. Imports (grouped by source)
import { useState, useCallback } from 'react'
import { someUtil } from '../lib/utils'
import type { ComponentProps } from '../types/game'

// 2. Type definitions
interface MyComponentProps {
  value: number
  onChange: (val: number) => void
}

// 3. Component implementation
export const MyComponent = ({ value, onChange }: MyComponentProps) => {
  // 4. State declarations
  const [localState, setLocalState] = useState(0)
  
  // 5. Callbacks (use useCallback for event handlers)
  const handleChange = useCallback(() => {
    onChange(value + 1)
  }, [value, onChange])
  
  // 6. Effects (if needed)
  useEffect(() => {
    // Effect logic
  }, [dependencies])
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Memoization Guidelines

**Use `React.memo` when:**
- Component receives complex props
- Component re-renders frequently (>30fps)
- Parent re-renders but props rarely change

**Examples:**
```typescript
// Game objects that render 60fps
export const FallingObject = memo(({ object }: Props) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return prevProps.object.id === nextProps.object.id &&
         prevProps.object.y === nextProps.object.y
})
```

**Use `useMemo` for:**
- Expensive calculations (>5ms)
- Object/array creation in render
- Filter/map operations on large arrays

**Use `useCallback` for:**
- Event handlers passed to memoized children
- Callbacks in dependency arrays
- Callbacks passed to external libraries

---

## ⚡ Performance Best Practices

### Game Loop Optimization

**DO:**
- Use `requestAnimationFrame` for animations
- Pre-allocate arrays when size is known
- Use early exits in collision detection
- Batch state updates when possible

**DON'T:**
- Use `setInterval` for game animations
- Create new objects/arrays in every frame
- Perform O(n²) operations in hot paths
- Update state synchronously in rapid succession

### Example: Efficient Object Updates

```typescript
// ❌ BAD: Creates new objects with spread operator
const updated = objects.map(obj => ({ ...obj, y: obj.y + 1 }))

// ✅ GOOD: Pre-allocate and construct explicitly
const updated = new Array(objects.length)
let index = 0
for (const obj of objects) {
  updated[index++] = {
    id: obj.id,
    x: obj.x,
    y: obj.y + fallSpeed,
    // ... other properties
  }
}
```

### CSS Performance

**Use:**
- CSS transforms over position changes
- `will-change` for animated elements
- CSS variables for dynamic theming
- Percentage-based positioning (not pixels)

**Example:**
```css
/* ✅ GOOD: GPU-accelerated */
.falling-object {
  transform: translate(var(--x), var(--y));
  will-change: transform;
}

/* ❌ BAD: Triggers layout recalculation */
.falling-object {
  left: 100px;
  top: 200px;
}
```

---

## 🎵 Audio System Best Practices

### Audio File Management

**File Naming:**
- Simple words: `apple.wav`, `banana.wav`
- Emoji prefixed: `emoji_apple.wav`
- Multi-word: `fire_truck.wav` (underscore separated)

**Loading Strategy:**
```typescript
// ✅ GOOD: Lazy load audio on demand
const audioLoader = async (key: string) => {
  if (!audioCache.has(key)) {
    const buffer = await loadAudioFile(key)
    audioCache.set(key, buffer)
  }
  return audioCache.get(key)
}

// ❌ BAD: Load all audio upfront
const allAudio = await Promise.all(audioFiles.map(load))
```

### Playback Best Practices

1. **Always use Web Audio API first** (correct pitch/speed)
2. **Set `playbackRate = 1.0`** for HTML audio fallback
3. **Implement graceful degradation**: Web Audio → HTML Audio → Speech Synthesis → Tones
4. **Cache audio buffers** to avoid repeated loading
5. **Stop previous audio** before playing new sounds to prevent overlap

---

## 🧪 Testing Best Practices

### Test Structure

```typescript
describe('MyComponent', () => {
  describe('Feature A', () => {
    it('should do X when Y happens', () => {
      // Arrange
      const input = createMockData()
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toEqual(expectedOutput)
    })
  })
})
```

### What to Test

**DO Test:**
- Pure utility functions (100% coverage goal)
- Complex business logic
- Edge cases and boundary conditions
- Performance-critical code paths
- Error handling and fallbacks

**DON'T Test:**
- Third-party library internals
- Trivial getters/setters
- React component render output (use E2E instead)
- CSS styling details

### Performance Testing

```typescript
it('should complete operation within acceptable time', () => {
  const iterations = 10000
  const start = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    performOperation()
  }
  
  const elapsed = performance.now() - start
  const avgTime = elapsed / iterations
  
  expect(avgTime).toBeLessThan(0.1) // < 0.1ms per operation
})
```

---

## 🔒 Security Best Practices

### Input Validation

```typescript
// ✅ GOOD: Validate and sanitize
function setVolume(value: number) {
  const clamped = Math.max(0, Math.min(1, value))
  audioContext.setVolume(clamped)
}

// ❌ BAD: Trust user input
function setVolume(value: number) {
  audioContext.setVolume(value) // Could be negative or > 1
}
```

### XSS Prevention

```typescript
// ✅ GOOD: Use React's built-in escaping
<div>{userName}</div>

// ❌ BAD: Dangerous HTML injection
<div dangerouslySetInnerHTML={{ __html: userName }} />
```

### Audio URL Validation

```typescript
// ✅ GOOD: Validate audio sources
const ALLOWED_AUDIO_DOMAINS = ['localhost', 'yourdomain.com']
const isValidAudioUrl = (url: string) => {
  const parsed = new URL(url)
  return ALLOWED_AUDIO_DOMAINS.includes(parsed.hostname)
}
```

---

## 📝 Code Style & Formatting

### TypeScript

**DO:**
- Use strict mode (`strict: true` in tsconfig)
- Prefer interfaces over types for objects
- Use type inference when obvious
- Add explicit return types for public functions
- Use `const` over `let` when possible
- Use optional chaining (`?.`) and nullish coalescing (`??`)

**DON'T:**
- Use `any` type (use `unknown` if type is truly unknown)
- Use non-null assertions (`!`) without verification
- Ignore TypeScript errors with `@ts-ignore`
- Use `var` (use `const` or `let`)

### Example:

```typescript
// ✅ GOOD
interface UserPreferences {
  volume: number
  difficulty: 'easy' | 'medium' | 'hard'
}

function getUserVolume(prefs?: UserPreferences): number {
  return prefs?.volume ?? 0.6
}

// ❌ BAD
function getUserVolume(prefs: any) {
  return prefs.volume || 0.6  // Treats 0 as falsy!
}
```

### React Hooks

**Rules:**
1. Only call hooks at top level (not in loops/conditions)
2. Only call hooks in React functions
3. Name custom hooks with `use` prefix
4. List all dependencies in dependency arrays

```typescript
// ✅ GOOD: Complete dependencies
useEffect(() => {
  const timer = setInterval(() => {
    updateGame(speed)
  }, 16)
  return () => clearInterval(timer)
}, [speed]) // All used variables listed

// ❌ BAD: Missing dependencies
useEffect(() => {
  const timer = setInterval(() => {
    updateGame(speed)
  }, 16)
  return () => clearInterval(timer)
}, []) // ESLint will warn about missing 'speed'
```

---

## 🚀 Build & Deploy Best Practices

### Before Committing

**Always run:**
```bash
npm run verify  # Runs lint + type check + build
npm test        # Run unit tests
```

**Check:**
- [ ] No new ESLint errors (warnings are OK if documented)
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] No console errors in dev mode
- [ ] Bundle size within acceptable limits

### Git Workflow

**Commit Messages:**
```
type(scope): brief description

Longer description if needed explaining:
- What changed
- Why it changed
- Any breaking changes

Refs: #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `test`: Add/update tests
- `docs`: Documentation only
- `chore`: Build/tooling changes

**Example:**
```
perf(game-loop): optimize object update with pre-allocation

Reduced object creation overhead by 54.9% through pre-allocated
arrays and explicit object construction instead of spread operator.

- Pre-allocate array with exact size
- Use indexed assignment instead of push
- Explicit property assignment instead of spread

Benchmark: 16.73ms → 7.55ms (54.9% improvement)

Refs: #456
```

### Bundle Size Management

**Monitor these chunks:**
- `game-hooks`: Keep < 20kB
- `game-utils`: Keep < 60kB
- `vendor-react-dom-core`: Keep < 200kB
- Individual vendor chunks: Keep < 30kB each

**If bundle grows:**
1. Check for accidental imports (e.g., importing entire library)
2. Use code splitting for rarely-used features
3. Lazy load debug/admin components
4. Review and update manual chunking in `vite.config.ts`

---

## 📚 Documentation Best Practices

### JSDoc Comments

**Add JSDoc for:**
- All exported functions/classes
- Complex algorithms
- Non-obvious behavior
- Public APIs

**Format:**
```typescript
/**
 * Calculate safe spawn position avoiding collisions with existing objects
 * 
 * Uses iterative adjustment algorithm to find collision-free position:
 * 1. Start at initial position
 * 2. Check for collisions with existing objects
 * 3. If collision detected, adjust position
 * 4. Clamp to lane boundaries
 * 
 * @param params - Spawn position parameters
 * @param params.initialX - Starting X position (percentage 0-100)
 * @param params.initialY - Starting Y position (percentage 0-100)
 * @param params.existingObjects - Array of objects to avoid
 * @param params.laneConstraints - Min/max X boundaries for lane
 * @returns Safe spawn coordinates
 * 
 * @example
 * ```typescript
 * const pos = calculateSafeSpawnPosition({
 *   initialX: 50,
 *   initialY: -10,
 *   existingObjects: currentObjects,
 *   laneConstraints: { minX: 5, maxX: 95 }
 * })
 * ```
 */
export function calculateSafeSpawnPosition(
  params: SpawnPositionParams
): { x: number; y: number } {
  // Implementation
}
```

### README Updates

**Update README.md when:**
- Adding new features
- Changing installation steps
- Adding/removing dependencies
- Changing build/deploy process
- Updating system requirements

### Markdown Documentation

**Create separate docs for:**
- Architecture decisions (ADRs)
- Bug investigation reports
- Performance optimization reports
- API references
- Troubleshooting guides

---

## 🎓 Learning Resources

### React Best Practices
- [React Beta Docs](https://react.dev/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### Performance
- [Web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about/)

---

## 🐛 Debugging Tips

### Performance Issues

1. **Use Performance Monitor** (in-game debug overlay)
2. **Check Event Tracker** for spawn rate warnings
3. **Profile with Chrome DevTools**:
   - Performance tab → Record → Stop
   - Look for long tasks (>50ms)
   - Check for layout thrashing
   - Monitor memory usage

### Audio Issues

1. **Check Console for `[SoundManager]` logs**
2. **Verify audio files are loaded**: See registered count
3. **Test audio context state**: Should be "running" after first interaction
4. **Check for file loading errors**: 404s or CORS issues
5. **Use "Test Audio" button** in debug overlay

### Touch/Input Issues

1. **Enable TouchHandlerDebug overlay**
2. **Check for debounce interference** (150ms)
3. **Verify multi-touch is enabled** during gameplay
4. **Test with single finger** first
5. **Check for conflicting event handlers**

---

## ✅ Code Review Checklist

### For Reviewers

- [ ] Code follows project style guide
- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] No performance regressions (check bundle size)
- [ ] No new ESLint errors
- [ ] TypeScript compilation successful
- [ ] Backward compatible (or breaking changes documented)
- [ ] Security implications considered
- [ ] Accessibility maintained/improved

### For Authors

- [ ] Self-reviewed code diff
- [ ] Ran `npm run verify` locally
- [ ] Added/updated tests
- [ ] Updated documentation
- [ ] Added comments for complex logic
- [ ] Checked bundle size impact
- [ ] Tested on target device (if applicable)
- [ ] Updated TODO.md if creating new tasks

---

## 🎯 Common Pitfalls to Avoid

### 1. Percentage Coordinates
❌ **DON'T** use absolute pixels for game object positions  
✅ **DO** use percentage-based positioning (0-100)

### 2. State Updates in Render
❌ **DON'T** call setState during render  
✅ **DO** use effects or event handlers for state updates

### 3. Missing Cleanup
❌ **DON'T** forget to cleanup timers/listeners  
✅ **DO** return cleanup function from useEffect

### 4. Audio Playback Rate
❌ **DON'T** forget to set `playbackRate = 1.0` for HTML audio  
✅ **DO** explicitly set playback rate to prevent distortion

### 5. Dependency Arrays
❌ **DON'T** ignore ESLint dependency warnings  
✅ **DO** include all dependencies or document why they're excluded

### 6. Premature Optimization
❌ **DON'T** optimize before measuring  
✅ **DO** profile first, then optimize hot paths

---

## 📞 Getting Help

### When Stuck

1. Check this document for guidance
2. Review similar code in the codebase
3. Check existing documentation (*.md files)
4. Search issues/PRs for similar problems
5. Ask for help with specific, reproducible examples

### Reporting Issues

**Include:**
- Environment (OS, browser, device)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Relevant console logs
- Code snippets

---

**Maintained by:** Development Team  
**Contributions:** Welcome! Submit PRs to improve this guide  
**Questions?** Open an issue or discussion
