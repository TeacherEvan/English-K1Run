# UI Layer Forensic Audit - February 2026

## Executive Summary

A critical regression has been identified where target elements (FallingObjects, Worms) render behind obstructing layers, causing total loss of user interactivity. This audit traces the root cause to CSS stacking context conflicts introduced by the `.game-area` CSS rules that create isolated stacking contexts, preventing proper z-index layering from the `UI_LAYER_MATRIX`.

---

## Root Cause Analysis

### 1. CSS Stacking Context Isolation

**File**: [`src/styles/game-area.css`](src/styles/game-area.css:40)

```css
.game-area > * {
  position: relative;
  z-index: 2;
}
```

**Problem**: This rule creates a stacking context on all direct children of `.game-area`, including the game objects container. When a parent element establishes a stacking context, child z-index values become relative only within that context.

### 2. Z-Index Value Conflict

| Component           | Intended Z-Index      | Actual Effective Z-Index        |
| ------------------- | --------------------- | ------------------------------- |
| FallingObject       | 20 (GAMEPLAY_OBJECTS) | 2 (trapped in stacking context) |
| Worm                | 30 (GAMEPLAY_HAZARDS) | 2 (trapped in stacking context) |
| FairyTransformation | 40 (GAMEPLAY_EFFECTS) | 2 (trapped in stacking context) |

### 3. Rendering Pipeline Trace

```
App.tsx
└── div.app (root container)
    └── AppGameplayScene (z-index: 10 - GAMEPLAY_BACKGROUND)
        └── PlayerArea > Card.game-area
            └── div.game-area::before (z-index: 1) ← Creates stacking context
            └── div.game-area > * (z-index: 2) ← TRAPS ALL CHILDREN
                └── div[data-testid="game-area"]
                    └── FallingObject (z-index: 20) ← EFFECTIVELY 2!
                    └── Worm (z-index: 30) ← EFFECTIVELY 2!
        └── HUD_PRIMARY layer (z-index: 80) ← OVERLAYS GAME OBJECTS
        └── TargetAnnouncementOverlay (z-index: 110)
```

### 4. The Blocking Mechanism

The HUD layer at z-index 80 is a sibling to the game area container. Since the game objects are trapped in a stacking context with effective z-index of 2, the HUD layer (80) renders ABOVE the game objects, blocking touch events.

---

## Detailed Component Analysis

### [`UI_LAYER_MATRIX`](src/lib/constants/ui-layer-matrix.ts:6)

```typescript
export const UI_LAYER_MATRIX = {
  GAMEPLAY_BACKGROUND: 10,
  GAMEPLAY_OBJECTS: 20,
  GAMEPLAY_HAZARDS: 30,
  GAMEPLAY_EFFECTS: 40,
  GAMEPLAY_OVERLAY: 60,
  HUD_PRIMARY: 80,
  HUD_SECONDARY: 90,
  HUD_CRITICAL: 110,
  // ...
};
```

The matrix is well-designed with proper separation. The issue is that these values are being negated by CSS stacking context isolation.

### [`FallingObject.tsx`](src/components/FallingObject.tsx:63)

```tsx
const objectStyle = useMemo(
  () => ({
    left: `${object.x}%`,
    top: 0,
    transform: `translate3d(-50%, ${object.y}px, 0)`,
    fontSize: `calc(${object.size}px * var(--object-scale, 1))`,
    lineHeight: 1,
    zIndex: UI_LAYER_MATRIX.GAMEPLAY_OBJECTS, // 20 - but ineffective!
  }),
  [object.x, object.y, object.size],
);
```

The inline z-index is correctly set, but CSS stacking context prevents it from working.

### [`PlayerArea.tsx`](src/components/PlayerArea.tsx:58)

```tsx
<Card
  data-testid={`player-area-${playerNumber}`}
  className="relative h-full border-0 game-area overflow-hidden" // ← 'game-area' class!
>
```

The `game-area` class triggers the problematic CSS rules.

### [`AppGameplayScene.tsx`](src/app/components/AppGameplayScene.tsx:62)

```tsx
<div className="absolute inset-0" style={{ zIndex: UI_LAYER_MATRIX.GAMEPLAY_BACKGROUND }}>
```

This container sets z-index: 10, but children inside `.game-area` are still trapped.

---

## Remediation Strategy

### Option A: Remove Stacking Context Isolation (Recommended)

**Modify** [`src/styles/game-area.css`](src/styles/game-area.css:40):

```css
/* BEFORE - Creates stacking context */
.game-area > * {
  position: relative;
  z-index: 2;
}

/* AFTER - Remove z-index, let inline styles work */
.game-area > * {
  position: relative;
  /* z-index removed - allows UI_LAYER_MATRIX values to work */
}
```

**Impact**: Low risk. The `::before` pseudo-element still provides visual overlay, but without z-index interference.

### Option B: Use Isolation Context

**Modify** [`src/styles/game-area.css`](src/styles/game-area.css:40):

```css
.game-area {
  isolation: isolate; /* Creates isolated stacking context for entire area */
}

.game-area::before {
  z-index: -1; /* Behind all children */
}
```

**Impact**: Medium risk. Requires testing to ensure all visual elements render correctly.

### Option C: Explicit Z-Index Hierarchy in CSS

**Modify** [`src/styles/game-area.css`](src/styles/game-area.css:40):

```css
.game-area::before {
  z-index: 10; /* GAMEPLAY_BACKGROUND */
}

.game-area .falling-object {
  z-index: 20; /* GAMEPLAY_OBJECTS */
}

.game-area .worm {
  z-index: 30; /* GAMEPLAY_HAZARDS */
}
```

**Impact**: Higher maintenance. Duplicates constants from `UI_LAYER_MATRIX`.

---

## Recommended Implementation Plan

### Phase 1: Immediate Fix

1. **Modify** [`src/styles/game-area.css`](src/styles/game-area.css:40):
   - Remove `z-index: 2` from `.game-area > *` rule
   - Keep `position: relative` for layout purposes

2. **Verify** [`src/styles/game-area.css`](src/styles/game-area.css:36):
   - Ensure `.game-area::before` has `pointer-events: none` (already present)
   - Consider setting `z-index: 0` or removing z-index entirely

### Phase 2: Validation

1. **Test touch interaction**:
   - Verify FallingObjects respond to tap events
   - Verify Worms respond to tap events
   - Verify HUD elements do not block game objects

2. **Test visual layering**:
   - Background renders behind objects
   - Objects render above background effects
   - HUD elements render above objects (but with `pointer-events: none`)

### Phase 3: Documentation

1. Add CSS architecture comments explaining z-index strategy
2. Document the relationship between `UI_LAYER_MATRIX` and CSS rules
3. Add E2E test for z-index regression prevention

---

## Files Requiring Changes

| File                                      | Change Type            | Priority |
| ----------------------------------------- | ---------------------- | -------- |
| `src/styles/game-area.css`                | Modify CSS rules       | Critical |
| `src/components/FallingObject.tsx`        | Verify z-index usage   | High     |
| `src/components/Worm.tsx`                 | Verify z-index usage   | High     |
| `src/components/PlayerArea.tsx`           | Verify class usage     | Medium   |
| `src/app/components/AppGameplayScene.tsx` | Verify layer structure | Medium   |

---

## Prevention Measures

### 1. Add CSS Lint Rule

```json
{
  "rules": {
    "declaration-no-important": true,
    "z-index-value-constraint": {
      "min": 0,
      "max": 200
    }
  }
}
```

### 2. Add E2E Test

```typescript
test("game objects are interactive above HUD layers", async ({ page }) => {
  // Start game
  // Verify falling objects receive tap events
  // Verify progress increases on correct tap
});
```

### 3. Architecture Documentation

Create `DOCS/Z_INDEX_ARCHITECTURE.md` documenting:

- The single source of truth: `UI_LAYER_MATRIX`
- CSS rules that must not create stacking contexts
- How to add new layers correctly

---

## Conclusion

The root cause is the CSS rule `.game-area > * { z-index: 2; }` which creates a stacking context that traps all game objects at z-index 2, preventing the intended z-index values (20, 30, 40) from the `UI_LAYER_MATRIX` from taking effect. The fix is straightforward: remove the z-index from this CSS rule and let inline styles from React components control the layer ordering.

---

_Audit completed: 2026-02-15_
_Auditor: Architect Mode_
