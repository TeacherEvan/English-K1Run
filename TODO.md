# TODO - Optimization & Refactoring Roadmap

**Last Updated:** December 24, 2025  
**Priority Legend:** 🔴 Critical | 🟡 High | 🟢 Medium | 🔵 Low | ⚪ Future

---

## 🎯 Current Status

**Code Quality:** 10/10 ✅  
**Tests:** 15/15 Passing ✅  
**Build:** Clean ✅  
**Performance:** 60fps target achieved ✅

---

## 📋 Active Tasks

### Welcome Screen Enhancements 🟡

- [x] Sequential audio (association ➜ choir tagline) wired and timed (~6.5s total)
- [x] Welcome audio regenerated via ElevenLabs `eleven_turbo_v2_5` (`welcome_association`, `welcome_learning`)
- [x] Add fallback copy if audio files missing (show text banner + optional skip) ✅ COMPLETED Dec 28, 2025
- [x] Preload welcome audio during splash to avoid first-play delay ✅ ALREADY IMPLEMENTED (lines 53-57)
- [ ] QA on tablets/QBoard: verify Thai font stack and volume balance at 0.9x playback rate

### Phase 1: Code Organization 🟡

#### Large Component Refactoring

- [ ] **ui/sidebar.tsx** (728 lines) - Extract navigation logic
  - [ ] Create `useSidebarNavigation` hook
  - [ ] Extract menu items to constants file
  - [ ] Split into smaller sub-components
  - **Impact:** Improved maintainability, testability
  - **Estimated Time:** 2-3 hours

- [x] **FairyTransformation.tsx** (308→270 lines) - Simplify animation logic ✅ COMPLETED Dec 2025
  - [x] Extract animation presets to constants → Created `fairy-animations.ts`
  - [ ] Consider using CSS animations instead of JS (future enhancement)
  - **Impact:** Better maintainability, 12% code reduction
  - **Completed:** December 2025 - See `AUDIO_AUDIT_FIX_DEC2025.md`

- [ ] **WormLoadingScreen.tsx** (257 lines) - Extract worm animation
  - [ ] Create reusable `WormAnimation` component
  - [ ] Separate loading logic from presentation
  - **Impact:** Code reuse, cleaner separation
  - **Estimated Time:** 1 hour

#### Large Utility Refactoring

- [ ] **sound-manager.ts** (900 lines) - Modularize responsibilities
  - [ ] Extract audio loading logic → `audio-loader.ts`
  - [ ] Extract audio playback logic → `audio-player.ts`
  - [ ] Extract speech synthesis → `speech-synthesizer.ts`
  - [ ] Keep orchestration in main sound-manager
  - **Impact:** Easier to test, maintain, and extend
  - **Estimated Time:** 3-4 hours
  - **Risk:** Medium (core functionality, needs thorough testing)

- [ ] **event-tracker.ts** (617 lines) - Split tracking concerns
  - [ ] Extract emoji tracking → `emoji-tracker.ts`
  - [ ] Extract performance metrics → `performance-tracker.ts`
  - [ ] Extract audio tracking → `audio-event-tracker.ts`
  - **Impact:** Better separation of concerns
  - **Estimated Time:** 2-3 hours

---

### Phase 2: Performance Optimizations 🟢

#### Lazy Loading Improvements

- [ ] **Debug Components** - Currently eager loaded
  - [ ] Lazy load `PerformanceMonitor` (166 lines)
  - [ ] Lazy load `EventTrackerDebug` (182 lines)
  - [ ] Lazy load `EmojiRotationMonitor` (189 lines)
  - [ ] Already done: `ErrorMonitor`, `FireworksDisplay`
  - **Impact:** Faster initial load time (~500ms improvement)
  - **Estimated Time:** 30 minutes

- [ ] **Audio File Loading Strategy**
  - [ ] Implement progressive audio loading
  - [ ] Load common sounds first (numbers, fruits)
  - [ ] Defer rare sounds (weather, vehicles)
  - **Impact:** 1-2s faster initial load on slow connections
  - **Estimated Time:** 2 hours
  - **Risk:** Low (additive change)

#### Memoization Opportunities

- [ ] **Display Settings Calculations** (`use-display-adjustment.ts`)
  - [ ] Add useMemo for scale calculations
  - [ ] Cache CSS variable updates
  - **Impact:** Reduce recalculation overhead
  - **Estimated Time:** 30 minutes

- [ ] **Category Item Filtering** (`use-game-logic.ts`)
  - [ ] Memoize filtered items by category
  - [ ] Cache current category items
  - **Impact:** Small but measurable during level changes
  - **Estimated Time:** 30 minutes

#### Render Optimization

- [ ] **Worm Component** - Review animation rendering
  - [ ] Consider CSS transforms over JS position updates
  - [ ] Evaluate `will-change` CSS property
  - **Impact:** Smoother worm animations
  - **Estimated Time:** 1 hour

---

### Phase 3: Developer Experience 🟡

#### TypeScript Improvements

- [ ] **Stricter Type Checking**
  - [ ] Enable `noUncheckedIndexedAccess` in tsconfig
  - [ ] Enable `noImplicitOverride`
  - [ ] Enable `exactOptionalPropertyTypes`
  - **Impact:** Catch potential bugs at compile time
  - **Estimated Time:** 2-3 hours (fixing violations)

- [ ] **Type Documentation**
  - [ ] Add JSDoc to all public APIs in `use-game-logic.ts`
  - [ ] Document types in `types/game.ts`
  - [ ] Add examples to complex type definitions
  - **Impact:** Better IDE autocomplete, developer onboarding
  - **Estimated Time:** 2 hours

#### Error Handling

- [ ] **Improved Error Boundaries**
  - [ ] Create category-specific error boundaries
  - [ ] Add error recovery suggestions
  - [ ] Log errors to event tracker
  - **Impact:** Better user experience on errors
  - **Estimated Time:** 1-2 hours

- [ ] **Audio Fallback Improvements**
  - [ ] Add user-friendly audio initialization UI
  - [ ] Better error messages for audio failures
  - [ ] Add "test audio" button in settings
  - **Impact:** Easier troubleshooting on BenQ displays
  - **Estimated Time:** 2 hours

#### Development Utilities

- [ ] **Create Developer Console**
  - [ ] Consolidate all debug overlays
  - [ ] Add keyboard shortcuts (Ctrl+D for debug)
  - [ ] Add performance profiling tools
  - **Impact:** Faster debugging and development
  - **Estimated Time:** 3 hours

---

### Phase 4: Testing Expansion 🟢

#### Unit Tests Needed

- [ ] **sound-manager.ts** - No tests currently
  - [ ] Test audio loading logic
  - [ ] Test fallback mechanisms
  - [ ] Test caching behavior
  - **Coverage Target:** 80%+
  - **Estimated Time:** 4 hours

- [ ] **event-tracker.ts** - No tests currently
  - [ ] Test event logging
  - [ ] Test performance metrics
  - [ ] Test emoji rotation tracking
  - **Coverage Target:** 80%+
  - **Estimated Time:** 3 hours

- [ ] **touch-handler.ts** (357 lines) - No tests
  - [ ] Test multi-touch validation
  - [ ] Test debouncing logic
  - [ ] Test drag detection
  - **Coverage Target:** 80%+
  - **Estimated Time:** 2 hours

#### Integration Tests

- [ ] **Game Flow Tests**
  - [ ] Test level selection → gameplay → winner flow
  - [ ] Test audio playback during gameplay
  - [ ] Test worm spawning and interaction
  - **Estimated Time:** 3 hours

#### Performance Regression Tests

- [ ] **Create Performance Benchmarks**
  - [ ] Baseline spawn rate benchmarks
  - [ ] Baseline render performance
  - [ ] Memory usage benchmarks
  - **Impact:** Prevent future performance regressions
  - **Estimated Time:** 2 hours

---

### Phase 5: Documentation 🔵

#### Code Documentation

- [ ] **Architecture Decision Records (ADRs)**
  - [ ] Document collision detection approach
  - [ ] Document audio system design
  - [ ] Document state management pattern
  - **Impact:** Knowledge preservation for future developers
  - **Estimated Time:** 4 hours

- [ ] **Component API Documentation**
  - [ ] Document props for all public components
  - [ ] Add usage examples
  - [ ] Document common patterns
  - **Estimated Time:** 3 hours

#### User Documentation

- [ ] **Troubleshooting Guide Updates**
  - [ ] Add common QBoard display issues
  - [ ] Add audio troubleshooting flowchart
  - [ ] Add performance optimization guide
  - **Estimated Time:** 2 hours

---

## ⚪ Future Considerations (Post-Current Work)

### Low Priority Improvements

#### Advanced Performance

- [ ] **Object Pooling** for GameObjects
  - Potential 10-20% memory improvement
  - Requires significant refactoring
  - Only needed if targeting 50+ concurrent objects

- [ ] **Spatial Partitioning** for Collisions
  - Already 86.7% efficient with early exits
  - Only needed if MAX_ACTIVE_OBJECTS > 50
  - Complexity outweighs current benefit

- [ ] **Web Workers** for Physics
  - Could offload collision detection
  - Adds message passing overhead
  - Only needed if consistent frame drops observed

#### Code Quality

- [ ] **Hook Size Reduction** (`use-game-logic.ts` - 1248 lines)
  - Split into multiple hooks if grows beyond 1500 lines
  - Current size is acceptable for now
  - Consider only if adding major features

- [ ] **CSS-in-JS Migration**
  - Current Tailwind + CSS is working well
  - Only consider if styling becomes unmaintainable

#### Feature Enhancements

- [ ] **Multiplayer Mode** (2-player split screen)
  - Major feature, requires architectural changes
  - Estimate: 40+ hours
  - Track in separate feature spec

- [ ] **Offline Mode** with Service Worker
  - Would enable offline gameplay
  - Requires asset caching strategy
  - Estimate: 8-10 hours

---

## 🎯 Quick Wins (High Impact, Low Effort)

**Can be completed in next 1-2 hours:**

1. ✅ **Create this TODO.md** - Done
2. [ ] **Add JSDoc to `useGameLogic` hook** (30 min)
3. [ ] **Extract button variant constants** (15 min)
4. [ ] **Add missing PropTypes to components** (45 min)
5. [ ] **Enable strict null checks in tsconfig** (30 min)
6. [ ] **Add keyboard shortcuts for debug mode** (30 min)

---

## 📊 Progress Tracking

### Completed ✅

- Lane partitioning optimization (44.9% improvement)
- Object update optimization (54.9% improvement)
- Event tracker optimization (O(n) → O(1))
- Duplicate checking optimization (55.7% improvement)
- TypeScript configuration fixes
- Unit testing infrastructure
- Spawn position utility extraction

### In Progress 🔄

- Optimization investigation and planning
- TODO documentation
- Best practices documentation

### Blocked ⛔

- None currently

---

## 🔍 Monitoring & Metrics

**Track these metrics before/after major changes:**

- Build time: ~3.25s (baseline)
- Bundle size: 7.4MB (baseline)
- Test run time: ~929ms (baseline)
- Frame rate: 60fps target
- Touch latency: <100ms target
- Memory usage: Stable over 15+ minute sessions

---

## 📝 Notes & Considerations

### Best Practices

- Always run `npm run verify` before committing
- Add tests for new utilities and functions
- Update documentation when changing public APIs
- Profile performance impact of major changes
- Keep bundle chunks under 1MB each

### Risk Management

- **Low Risk:** Documentation, tests, new utilities
- **Medium Risk:** Component refactoring, type changes
- **High Risk:** Core game logic changes, build config changes

### Dependencies to Watch

- React 19: Still evolving, keep `--noCheck` for now
- Vite 7: New major version, monitor for issues
- Tailwind 4: Recently upgraded, watch for CSS issues

---

**Owner:** GitHub Copilot  
**Reviewers:** Development Team  
**Status:** Living Document (update as work progresses)
