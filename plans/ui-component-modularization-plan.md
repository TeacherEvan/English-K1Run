# UI Component Modularization Plan

**Date:** January 30, 2026  
**Objective:** Refactor oversized UI components to comply with 200-line limit per file  
**Status:** Architecture Phase

## Executive Summary

This plan addresses the modularization of UI components in [`src/components/`](../src/components/) that exceed the strict 200-line limit. The refactoring follows the established patterns from the [`src/lib/audio/`](../src/lib/audio/) modular structure and maintains backward compatibility while improving maintainability.

---

## 1. Line Count Audit Report

### Files Exceeding 200 Lines

| File Path                                                                                  | Lines | Priority | Complexity                                                  |
| ------------------------------------------------------------------------------------------ | ----- | -------- | ----------------------------------------------------------- |
| [`HomeWindow.tsx`](../src/components/HomeWindow.tsx)                                       | 344   | HIGH     | High - Complex state management and multiple sub-components |
| [`WelcomeScreen.tsx`](../src/components/WelcomeScreen.tsx)                                 | 290   | HIGH     | High - Complex audio sequence and lifecycle management      |
| [`WormLoadingScreen.tsx`](../src/components/WormLoadingScreen.tsx)                         | 257   | MEDIUM   | Medium - Animation logic and state management               |
| [`ui/sidebar/sidebar-menu.tsx`](../src/components/ui/sidebar/sidebar-menu.tsx)             | 239   | LOW      | Medium - Multiple related components                        |
| [`game-menu/GameMenuLevelSelect.tsx`](../src/components/game-menu/GameMenuLevelSelect.tsx) | 186   | LOW      | Low - Near limit but acceptable                             |
| [`ui/sidebar/sidebar-core.tsx`](../src/components/ui/sidebar/sidebar-core.tsx)             | 183   | LOW      | Low - Near limit but acceptable                             |
| [`game-menu/GameMenuHome.tsx`](../src/components/game-menu/GameMenuHome.tsx)               | 171   | LOW      | Low - Acceptable                                            |

### Files Within Limits (Reference)

These files demonstrate good modular practices:

- [`FallingObject.tsx`](../src/components/FallingObject.tsx) - 147 lines ✅
- [`PlayerArea.tsx`](../src/components/PlayerArea.tsx) - 122 lines ✅
- [`GameDebug.tsx`](../src/components/GameDebug.tsx) - 115 lines ✅
- [`GameMenu.tsx`](../src/components/GameMenu.tsx) - 101 lines ✅ (already modularized)
- [`Worm.tsx`](../src/components/Worm.tsx) - 76 lines ✅

---

## 2. Detailed Refactoring Plans

### 2.1 HomeWindow.tsx (344 lines → Multiple files)

**Current Structure:**

- Main component with state management
- Three extracted tab components (LevelsTab, SettingsTab, CreditsTab)
- Tab content router component
- Complex props interfaces

**Proposed Modular Structure:**

```
src/components/home-window/
├── index.tsx                    (~80 lines) - Main export and composition
├── types.ts                     (~30 lines) - TypeScript interfaces
├── HomeWindowContainer.tsx      (~90 lines) - State management container
├── HomeWindowLayout.tsx         (~60 lines) - Layout wrapper with tabs
├── tabs/
│   ├── LevelsTab.tsx           (~75 lines) - Level selection UI
│   ├── SettingsTab.tsx         (~70 lines) - Settings controls
│   ├── CreditsTab.tsx          (~30 lines) - Credits display
│   └── index.ts                (~10 lines) - Tab exports
└── hooks/
    └── use-home-settings.ts    (~50 lines) - Settings state logic
```

**Breakdown Details:**

1. **`index.tsx`** (Main Export - ~80 lines)
   - Re-exports main HomeWindow component
   - Provides clean API for consumers
   - No breaking changes to existing imports

2. **`types.ts`** (~30 lines)
   - `HomeWindowProps` interface
   - `TabId` type
   - `TabProps` interface
   - Internal type definitions

3. **`HomeWindowContainer.tsx`** (~90 lines)
   - State management (activeTab, scales, applying state)
   - All useCallback handlers
   - Orchestrates tab switching
   - Composes layout with tab contents

4. **`HomeWindowLayout.tsx`** (~60 lines)
   - Tab navigation UI
   - Card wrapper
   - Header with emoji and title
   - Tab button rendering
   - Error boundary integration

5. **`tabs/LevelsTab.tsx`** (~75 lines)
   - Level grid rendering
   - Continuous mode toggle
   - Error handling for game start
   - Memoized for performance

6. **`tabs/SettingsTab.tsx`** (~70 lines)
   - Font scale slider
   - Object scale slider
   - Apply settings button
   - Accessibility labels

7. **`tabs/CreditsTab.tsx`** (~30 lines)
   - Static credits display
   - Version information
   - Simple presentational component

8. **`hooks/use-home-settings.ts`** (~50 lines)
   - Encapsulates settings state logic
   - Handles scale changes
   - Apply settings with error handling
   - Returns stable callbacks

**Migration Strategy:**

```typescript
// Before (existing code)
import { HomeWindow } from "./components/HomeWindow";

// After (no changes needed - backward compatible)
import { HomeWindow } from "./components/home-window";
```

**Risk Level:** MEDIUM

- Multiple files to coordinate
- State management split requires careful testing
- Error boundary integration needs verification

---

### 2.2 WelcomeScreen.tsx (290 lines → Multiple files)

**Current Structure:**

- Complex audio sequence management
- Video/fallback image handling
- Multiple useEffect hooks
- Keyboard and interaction handlers
- Safety timers and E2E bypass logic

**Proposed Modular Structure:**

```
src/components/welcome-screen/
├── index.tsx                        (~50 lines) - Main export and composition
├── types.ts                         (~20 lines) - TypeScript interfaces
├── WelcomeScreenContainer.tsx       (~90 lines) - State and lifecycle management
├── WelcomeScreenMedia.tsx           (~70 lines) - Video/image rendering
├── hooks/
│   ├── use-audio-sequence.ts       (~100 lines) - Audio playback orchestration
│   └── use-welcome-interactions.ts (~50 lines) - Keyboard/click handlers
└── utils/
    └── welcome-helpers.ts          (~30 lines) - E2E detection, helpers
```

**Breakdown Details:**

1. **`index.tsx`** (Main Export - ~50 lines)
   - Exports WelcomeScreen component
   - Minimal wrapper for backward compatibility
   - Imports and re-exports container

2. **`types.ts`** (~20 lines)
   - `WelcomeScreenProps` interface
   - Internal state type definitions

3. **`WelcomeScreenContainer.tsx`** (~90 lines)
   - Main component logic coordination
   - State declarations (fadeOut, readyToContinue, etc.)
   - useEffect orchestration
   - Composes media component
   - Handles proceed callback

4. **`WelcomeScreenMedia.tsx`** (~70 lines)
   - Video element with autoplay
   - Fallback image rendering
   - "Tap to continue" overlay
   - Event handlers (onCanPlay, onEnded, onError)
   - Inline CSS animations

5. **`hooks/use-audio-sequence.ts`** (~100 lines)
   - startAudioSequence function logic
   - 4-phase audio playback
   - Timeout and cancellation handling
   - Safety timers (10s button, 15s auto-advance)
   - AudioContext resume logic
   - Returns: `{ startAudioSequence, audioReady }`

6. **`hooks/use-welcome-interactions.ts`** (~50 lines)
   - Keyboard handler (Escape, Space, Enter)
   - Primary action click handler
   - E2E bypass logic
   - Combines audio trigger with proceed
   - Returns: `{ handlePrimaryAction, handleKeyPress }`

7. **`utils/welcome-helpers.ts`** (~30 lines)
   - `isE2EMode()` - Detects ?e2e=1 param
   - `safetyTimerConfig` - Constants for timers
   - Helper utilities

**Migration Strategy:**

```typescript
// Before
import { WelcomeScreen } from "./components/WelcomeScreen";

// After (backward compatible)
import { WelcomeScreen } from "./components/welcome-screen";
```

**Risk Level:** HIGH

- Complex audio state management
- Multiple interdependent useEffect hooks
- Timing-sensitive logic (race conditions possible)
- E2E tests depend on specific behavior

---

### 2.3 WormLoadingScreen.tsx (257 lines → Multiple files)

**Current Structure:**

- Worm animation state and physics
- Splat management
- Click/touch handlers
- Animation loop with requestAnimationFrame
- Performance throttling

**Proposed Modular Structure:**

```
src/components/worm-loading-screen/
├── index.tsx                    (~50 lines) - Main export
├── types.ts                     (~40 lines) - Worm, Splat interfaces
├── WormLoadingContainer.tsx     (~80 lines) - State management
├── WormAnimation.tsx            (~40 lines) - Worm rendering
├── SplatEffect.tsx              (~30 lines) - Splat rendering
├── hooks/
│   ├── use-worm-physics.ts     (~80 lines) - Movement and collision
│   └── use-worm-interactions.ts (~50 lines) - Click/touch handling
└── utils/
    └── worm-constants.ts       (~20 lines) - Physics constants
```

**Breakdown Details:**

1. **`index.tsx`** (Main Export - ~50 lines)
   - Re-exports WormLoadingScreen
   - Imports CSS
   - Backward compatible API

2. **`types.ts`** (~40 lines)
   - `Worm` interface (id, x, y, vx, vy, alive, angle, wigglePhase)
   - `Splat` interface (id, x, y, createdAt)
   - `WormLoadingScreenProps` interface

3. **`WormLoadingContainer.tsx`** (~80 lines)
   - Main state (worms, splats, speedMultiplier, currentTime)
   - useEffect for splat cleanup
   - useEffect for completion check
   - Composes WormAnimation and SplatEffect
   - Loading message and skip button

4. **`WormAnimation.tsx`** (~40 lines)
   - Maps worms to rendered elements
   - Handles transform and positioning
   - Receives onWormClick callback
   - Wiggle animation class

5. **`SplatEffect.tsx`** (~30 lines)
   - Renders splat emoji with fade
   - Calculates opacity based on age
   - Positioned absolutely

6. **`hooks/use-worm-physics.ts`** (~80 lines)
   - requestAnimationFrame loop (throttled to 30fps)
   - Worm position updates
   - Boundary collision detection
   - Velocity calculations
   - Wiggle phase updates
   - Returns: `{ worms, setWorms, animationFrameRef }`

7. **`hooks/use-worm-interactions.ts`** (~50 lines)
   - handleWormClick function
   - Creates splat on click
   - Marks worm as dead
   - Increases speed multiplier
   - Returns: `{ handleWormClick }`

8. **`utils/worm-constants.ts`** (~20 lines)
   - `WORM_COUNT`, `WORM_SIZE`, `BASE_SPEED`
   - `SPLAT_DURATION`, `SPEED_INCREASE_FACTOR`
   - `UPDATE_INTERVAL` for throttling

**Migration Strategy:**

```typescript
// Before
import { WormLoadingScreen } from "./components/WormLoadingScreen";

// After (backward compatible)
import { WormLoadingScreen } from "./components/worm-loading-screen";
```

**Risk Level:** MEDIUM-HIGH

- Animation performance sensitive
- Physics calculations need to remain consistent
- requestAnimationFrame cleanup critical
- Touch event handling must work identically

---

### 2.4 ui/sidebar/sidebar-menu.tsx (239 lines → Multiple files)

**Current Structure:**

- Multiple related sidebar components
- 10 exported components in single file
- Shared utilities and variants

**Proposed Modular Structure:**

```
src/components/ui/sidebar/
├── sidebar-menu/
│   ├── index.ts                    (~30 lines) - All exports
│   ├── SidebarMenu.tsx            (~20 lines) - Menu container
│   ├── SidebarMenuItem.tsx        (~20 lines) - Menu item wrapper
│   ├── SidebarMenuButton.tsx      (~70 lines) - Button with tooltip
│   ├── SidebarMenuAction.tsx      (~40 lines) - Action button
│   ├── SidebarMenuBadge.tsx       (~30 lines) - Badge component
│   ├── SidebarMenuSkeleton.tsx    (~40 lines) - Loading skeleton
│   └── SidebarMenuSub.tsx         (~50 lines) - Sub-menu components
```

**Breakdown Details:**

1. **`index.ts`** (~30 lines)
   - Barrel export for all menu components
   - Maintains existing import paths
   - No breaking changes

2. **`SidebarMenu.tsx`** (~20 lines)
   - Simple `<ul>` wrapper with styling
   - Data attributes for sidebar system

3. **`SidebarMenuItem.tsx`** (~20 lines)
   - `<li>` wrapper with group styling
   - Single responsibility

4. **`SidebarMenuButton.tsx`** (~70 lines)
   - Button with variant props
   - Tooltip integration
   - Slot pattern for composition
   - Active state handling

5. **`SidebarMenuAction.tsx`** (~40 lines)
   - Action button styling
   - Show on hover logic
   - Peer hover interactions

6. **`SidebarMenuBadge.tsx`** (~30 lines)
   - Badge positioning and styling
   - Tabular nums for counts

7. **`SidebarMenuSkeleton.tsx`** (~40 lines)
   - Loading state component
   - Optional icon display
   - Uses memoized width

8. **`SidebarMenuSub.tsx`** (~50 lines)
   - Contains SidebarMenuSub
   - Contains SidebarMenuSubItem
   - Contains SidebarMenuSubButton
   - Related sub-menu components grouped together

**Migration Strategy:**

```typescript
// Before
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar/sidebar-menu";

// After (no changes needed)
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar/sidebar-menu";
// index.ts handles re-exports
```

**Risk Level:** LOW

- Simple component splits
- No complex state
- Existing import paths maintained via barrel export

---

## 3. Implementation Order & Phase Plan

### Phase 1: Low-Risk Foundation (Week 1)

**Goal:** Establish patterns with simple components

1. **`ui/sidebar/sidebar-menu.tsx`** → `sidebar-menu/` directory
   - Lowest complexity
   - Sets precedent for other refactors
   - Tests barrel export pattern
   - **Estimated Effort:** 4 hours

### Phase 2: Medium Complexity (Week 2)

**Goal:** Apply patterns to animation-heavy components

2. **`WormLoadingScreen.tsx`** → `worm-loading-screen/` directory
   - Self-contained component
   - Limited external dependencies
   - Good test for hooks extraction
   - **Estimated Effort:** 8 hours

### Phase 3: High Complexity Components (Week 3-4)

**Goal:** Refactor core navigation and onboarding

3. **`HomeWindow.tsx`** → `home-window/` directory
   - Complex state management
   - Multiple sub-components
   - Existing error boundaries
   - **Estimated Effort:** 12 hours

4. **`WelcomeScreen.tsx`** → `welcome-screen/` directory
   - Audio sequence timing critical
   - E2E test dependencies
   - Multiple lifecycle effects
   - **Estimated Effort:** 16 hours

**Total Estimated Effort:** 40 hours (1 week sprint)

---

## 4. Risk Assessment & Mitigation

### High-Risk Areas

#### WelcomeScreen Audio Timing

**Risk:** Breaking audio sequence synchronization  
**Impact:** User hears overlapping/incorrect audio  
**Mitigation:**

- Preserve exact useEffect dependency arrays
- Test on real devices (not just desktop)
- Add integration tests for audio sequence
- Keep E2E tests running throughout
- Consider feature flag for gradual rollout

#### Animation Performance (WormLoadingScreen)

**Risk:** requestAnimationFrame cleanup causing memory leaks  
**Impact:** Browser slowdown, especially on tablets  
**Mitigation:**

- Profile with Chrome DevTools Performance tab
- Test on actual tablets (target device)
- Maintain 30fps throttling logic
- Add performance regression tests

#### Type Safety Across Modules

**Risk:** Losing TypeScript type checking at module boundaries  
**Impact:** Runtime errors from interface mismatches  
**Mitigation:**

- Strict TypeScript configuration maintained
- Explicit interface exports in `types.ts` files
- Run `tsc --noEmit` after each phase
- Use type guards for runtime validation

### Medium-Risk Areas

#### Import Path Changes

**Risk:** Breaking imports in test files or other components  
**Impact:** Build failures, test failures  
**Mitigation:**

- Use barrel exports (index.ts) for backward compatibility
- Global search for all import references
- Update all imports atomically in same commit
- Run full test suite before merging

#### State Management Split

**Risk:** Losing state synchronization between hooks  
**Impact:** UI inconsistencies, stale state  
**Mitigation:**

- Keep state as close to usage as possible
- Use React DevTools to inspect state tree
- Add integration tests for state transitions
- Document state flow in component diagrams

### Low-Risk Areas

#### Sidebar Components

- Simple presentational components
- No complex state
- Minimal interdependencies

---

## 5. Testing Strategy

### Unit Tests (New)

Create focused unit tests for each extracted module:

```typescript
// Example: hooks/use-audio-sequence.test.ts
describe("useAudioSequence", () => {
  it("should play 4-phase sequence in order", async () => {
    // Test audio sequence logic
  });

  it("should cancel sequence on unmount", () => {
    // Test cleanup
  });

  it("should trigger safety timer after 15s", () => {
    // Test timeout behavior
  });
});
```

### Integration Tests (Enhanced)

- Add E2E test for WelcomeScreen audio sequence (already exists, verify)
- Add visual regression tests for HomeWindow tabs
- Test WormLoadingScreen animation performance

### Regression Tests (Critical)

- Run existing E2E suite after each phase
- Specifically test:
  - `e2e/specs/menu.spec.ts` (HomeWindow)
  - `e2e/specs/audio-overlap.spec.ts` (WelcomeScreen)
  - Touch interaction specs (WormLoadingScreen)

---

## 6. Code Quality Checklist

For each refactored component:

- [ ] No file exceeds 200 lines
- [ ] TypeScript interfaces in separate `types.ts`
- [ ] Custom hooks in `hooks/` directory
- [ ] Utilities in `utils/` directory
- [ ] Backward-compatible imports via barrel exports
- [ ] Memo applied to presentational components
- [ ] useCallback for event handlers
- [ ] useMemo for expensive computations
- [ ] PropTypes or TypeScript interfaces documented
- [ ] Accessibility attributes preserved
- [ ] Test IDs maintained for E2E tests
- [ ] Console logs cleaned up (production)
- [ ] ESLint passes with no warnings
- [ ] TypeScript compiles with `--noEmit`

---

## 7. Documentation Updates

After refactoring:

1. **Update [`DOCS/BEST_PRACTICES.md`](../DOCS/BEST_PRACTICES.md)**
   - Add component modularization guidelines
   - Document barrel export pattern
   - Show before/after examples

2. **Update Component README (new)**
   - Create `src/components/README.md`
   - Document directory structure
   - Explain hooks and utils patterns

3. **Update Architecture Docs**
   - Document new component organization
   - Update component dependency graph
   - Add module boundaries diagram

4. **Code Comments**
   - Add JSDoc to exported hooks
   - Document complex logic in utils
   - Explain performance optimizations

---

## 8. Performance Considerations

### Bundle Size Impact

- **Before:** Single large files → larger initial chunks
- **After:** Smaller modules → better code splitting
- **Action:** Analyze with `vite-bundle-visualizer`

### Runtime Performance

- **Memoization:** Maintain or improve with extracted hooks
- **Re-renders:** Reduce by isolating state
- **Animation:** Profile before/after with Chrome DevTools

### Development Experience

- **Hot Reload:** Smaller files → faster HMR
- **TypeScript:** Faster type checking
- **IDE:** Better autocomplete and navigation

---

## 9. Rollback Strategy

If issues arise during production deployment:

### Immediate Rollback (< 5 minutes)

1. Revert deployment to previous commit
2. Notify team via Slack/Discord
3. Document issue in GitHub

### Partial Rollback (1 hour)

1. Identify problematic component
2. Revert specific component changes
3. Keep other successful refactors
4. Deploy hotfix

### Full Investigation (1 day)

1. Reproduce issue locally
2. Add failing test case
3. Fix root cause
4. Re-deploy with fix

---

## 10. Success Metrics

### Quantitative Metrics

- ✅ All files ≤ 200 lines
- ✅ Test coverage maintained or improved (target: 80%+)
- ✅ Bundle size increase < 5% (acceptable for better maintainability)
- ✅ Build time change < 10%
- ✅ No new ESLint/TypeScript errors

### Qualitative Metrics

- ✅ Easier to navigate codebase
- ✅ Faster PR reviews (smaller diffs)
- ✅ New developers onboard faster
- ✅ Components easier to test in isolation
- ✅ Clear separation of concerns

---

## 11. Example Implementation

### Before: WelcomeScreen.tsx (290 lines)

```typescript
// src/components/WelcomeScreen.tsx
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  // 290 lines of state, effects, handlers, and JSX
});
```

### After: Modular Structure

```typescript
// src/components/welcome-screen/index.tsx
export { WelcomeScreen } from './WelcomeScreenContainer'

// src/components/welcome-screen/WelcomeScreenContainer.tsx (~90 lines)
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const { startAudioSequence, audioReady } = useAudioSequence()
  const { handlePrimaryAction } = useWelcomeInteractions({ onComplete, audioReady })
  const [fadeOut, setFadeOut] = useState(false)

  return (
    <div className="welcome-screen" onClick={handlePrimaryAction}>
      <WelcomeScreenMedia
        fadeOut={fadeOut}
        audioReady={audioReady}
        onVideoLoaded={() => startAudioSequence()}
      />
    </div>
  )
})

// src/components/welcome-screen/hooks/use-audio-sequence.ts (~100 lines)
export function useAudioSequence() {
  // Extracted audio logic
}

// src/components/welcome-screen/hooks/use-welcome-interactions.ts (~50 lines)
export function useWelcomeInteractions({ onComplete, audioReady }) {
  // Extracted interaction handlers
}

// src/components/welcome-screen/WelcomeScreenMedia.tsx (~70 lines)
export const WelcomeScreenMedia = memo(({ fadeOut, audioReady, onVideoLoaded }) => {
  // Extracted media rendering
})
```

---

## 12. Approval & Sign-Off

### Architecture Review

- [ ] Senior Engineer Review
- [ ] Tech Lead Approval
- [ ] Security Review (if needed)

### Implementation Readiness

- [ ] All questions answered
- [ ] Resources allocated
- [ ] Timeline approved

### Go/No-Go Decision

- [ ] **GO** - Proceed with implementation
- [ ] **ITERATE** - Refine plan based on feedback
- [ ] **NO-GO** - Defer refactoring

---

## Conclusion

This refactoring plan provides a comprehensive, phased approach to modularizing oversized UI components while maintaining backward compatibility and minimizing risk. By following the established patterns from [`src/lib/audio/`](../src/lib/audio/), we ensure consistency across the codebase.

**Key Takeaways:**

1. Four components require refactoring to meet 200-line limit
2. Phased approach reduces deployment risk
3. Comprehensive testing strategy ensures stability
4. Backward-compatible via barrel exports
5. Clear success metrics for validation

**Next Steps:**

1. Obtain stakeholder approval
2. Create feature branch: `refactor/ui-component-modularization`
3. Begin Phase 1 implementation
4. Schedule code review after each phase

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Authors:** Senior Systems Engineer (Architect Mode)  
**Status:** Ready for Implementation
