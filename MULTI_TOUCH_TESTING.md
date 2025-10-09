# Multi-Touch Testing Guide for QBoard Displays

## Quick Test Scenarios

### Test 1: Basic Multi-Touch (Accidental Palm Contact)

**Setup:**

1. Start any game level
2. Position one student at Player 1 side, another at Player 2 side

**Test:**

1. Have Player 1 place their palm on their side of screen (creating 4-5 touch points)
2. While palm is down, have Player 2 tap falling objects on their side
3. Lift palm, verify Player 1 can still tap normally

**Expected Result:**

- ✅ Player 2's taps register correctly despite Player 1's palm
- ✅ No game objects respond to palm contact (only intentional taps)
- ✅ Both players can score independently

**Debug Check:**

- Open `TouchHandlerDebug` (bottom-left corner)
- Should show "Active Touches: 5+" when palm is down
- Should return to "Active Touches: 0-2" when tapping normally

---

### Test 2: Rapid Double-Tap Prevention

**Setup:**

1. Start "Counting Fun" level (larger targets)
2. Enable TouchHandlerDebug overlay

**Test:**

1. Tap the same falling object 5 times as fast as possible
2. Observe score increase

**Expected Result:**

- ✅ Score increases only once (debounced)
- ✅ Audio plays only once per object
- ✅ Debug overlay shows "Debounced tap" messages in console

**Debug Check:**

```
[MultiTouchHandler] Valid tap: ID=0, Target=object-123, Duration=45ms
[MultiTouchHandler] Debounced tap: Target=object-123, TimeSince=67ms
[MultiTouchHandler] Debounced tap: Target=object-123, TimeSince=34ms
```

---

### Test 3: Drag vs Tap Differentiation

**Setup:**

1. Start "Alphabet Challenge" level
2. Open browser DevTools console (F12)

**Test:**

1. Swipe finger across the screen horizontally
2. Then tap an object normally
3. Check console for validation messages

**Expected Result:**

- ✅ Swipe gestures don't score points
- ✅ Normal taps score correctly
- ✅ Console shows "Invalid tap (drag)" for swipes

**Debug Check:**

```
[MultiTouchHandler] Invalid tap (drag): ID=1, Duration=125ms, Movement=67px
[MultiTouchHandler] Valid tap: ID=2, Target=A, Duration=89ms, Movement=3px
```

---

### Test 4: Long-Press Rejection

**Setup:**

1. Start any game level
2. Open TouchHandlerDebug overlay

**Test:**

1. Press and hold on a falling object for 1 second
2. Then tap another object quickly
3. Observe which registers

**Expected Result:**

- ✅ Long-press doesn't score (rejected)
- ✅ Quick tap scores normally
- ✅ Console shows "Invalid tap (long-press)"

**Debug Check:**

```
[MultiTouchHandler] Invalid tap (long-press): ID=3, Duration=892ms, Movement=5px
[MultiTouchHandler] Valid tap: ID=4, Target=🍎, Duration=123ms, Movement=2px
```

---

### Test 5: Simultaneous Multi-Player Taps

**Setup:**

1. Start "Animals & Nature" level
2. Position both students ready at their screens

**Test:**

1. On count of three, both players tap their current target simultaneously
2. Repeat 10 times rapidly

**Expected Result:**

- ✅ Both taps register independently
- ✅ Both progress bars advance correctly
- ✅ No interference between players
- ✅ No "ghost" taps or missed inputs

**Debug Check:**

- TouchHandlerDebug should show "Active Touches: 2" during simultaneous taps
- Both progress bars should advance smoothly
- EventTrackerDebug should show 2 "Correct tap" events

---

### Test 6: Performance Under Load

**Setup:**

1. Start "Fruits & Vegetables" level
2. Enable all debug overlays:
   - TouchHandlerDebug (bottom-left)
   - PerformanceMonitor (top-right)
   - EventTrackerDebug (toggle with button)

**Test:**

1. Play continuously for 2 minutes with both players
2. Intentionally create accidental touches (lean on screen)
3. Monitor FPS and touch statistics

**Expected Result:**

- ✅ FPS stays above 55 (target: 60)
- ✅ "Recent Taps" in TouchHandlerDebug stays below 10
- ✅ No memory warnings in PerformanceMonitor
- ✅ Active touches return to 0 when not touching

**Debug Check:**

```
Performance:
- FPS: 58-60
- Object Spawn Rate: 2-4 per second
- Touch Latency: < 50ms

Touch Handler:
- Active Touches: 0 (when idle)
- Recent Taps: 3-8 (during gameplay)
```

---

## Configuration Tuning

If tests reveal issues, adjust settings in `src/lib/touch-handler.ts`:

### For Younger Students (K1-K2)

```typescript
const multiTouchHandler = new MultiTouchHandler({
  debounceMs: 200,          // Slower fingers, more debounce
  tapThresholdMs: 400,      // Allow slower taps
  movementThresholdPx: 15,  // Allow more hand wiggle
  debug: true               // Keep debugging on
})
```

### For Older Students (K3+)

```typescript
const multiTouchHandler = new MultiTouchHandler({
  debounceMs: 100,          // Faster fingers, less debounce
  tapThresholdMs: 250,      // Expect quicker taps
  movementThresholdPx: 8,   // More precise taps
  debug: false              // Disable for performance
})
```

### For High-Traffic QBoards (Whole Class)

```typescript
const multiTouchHandler = new MultiTouchHandler({
  debounceMs: 180,          // Moderate debounce
  tapThresholdMs: 350,      // Moderate threshold
  movementThresholdPx: 12,  // Moderate precision
  debug: false              // Performance priority
})
```

---

## Troubleshooting

### Problem: Taps not registering

**Check:**

1. Is TouchHandlerDebug showing "Active Touches > 0"?
   - If NO: Touch events not reaching handler → Check browser compatibility
   - If YES: Touches being rejected → Check console for "Invalid tap" reasons

2. Common causes:
   - Finger moving > 10px during tap → Increase `movementThresholdPx`
   - Tap duration > 300ms → Increase `tapThresholdMs`
   - Rapid repeat taps → Decrease `debounceMs`

### Problem: Double-taps still occurring

**Check:**

1. Console shows multiple "Valid tap" for same target within 150ms?
   - If YES: Increase `debounceMs` to 200-250ms

2. TouchHandlerDebug shows "Recent Taps" growing without bound?
   - If YES: Memory leak → Check for cleanup interval running

### Problem: Performance degradation

**Check:**

1. PerformanceMonitor shows FPS < 30?
   - If YES: Too many debug logs → Set `debug: false`

2. TouchHandlerDebug shows "Recent Taps > 50"?
   - If YES: Cleanup not running → Check 5s interval is active

---

## Production Checklist

Before deploying to QBoard:

- [ ] Set `debug: false` in touch-handler.ts
- [ ] Test all 6 scenarios above
- [ ] Verify FPS > 55 during 2-minute session
- [ ] Confirm no console errors in production build
- [ ] Test fullscreen mode activates properly
- [ ] Verify audio pronunciations work on QBoard browser
- [ ] Test with 2-4 students playing simultaneously
- [ ] Document any configuration changes made

---

## Emergency Disable

If multi-touch causes issues in production:

**Quick Fix** (disable touch handler):

```typescript
// In src/hooks/use-game-logic.ts, comment out:
// multiTouchHandler.enable()  // Line ~572
// multiTouchHandler.disable() // Line ~613
```

**Fallback Mode** (revert to simple touch):

```typescript
// In src/components/FallingObject.tsx, replace handlers with:
const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
  e.preventDefault()
  e.stopPropagation()
  playSoundEffect.tap()
  onTap(object.id, playerSide)
}
```

Build and deploy. This reverts to original simple touch behavior.
