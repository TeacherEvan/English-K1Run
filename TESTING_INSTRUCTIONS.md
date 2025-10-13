# Testing Instructions - After Performance Fix

## Quick Test (2 minutes)

1. **Open the game**: Navigate to <http://localhost:5173/>
2. **Test level selection**: Click through different levels (Fruits, Numbers, etc.)
3. **Start the game**: Click "🚀 Start Race" button
4. **Verify emojis fall**: Within 2 seconds, emojis should start falling from the top
5. **Check continuous spawning**: Emojis should keep spawning every ~1.6 seconds
6. **Test gameplay**: Tap correct emojis and watch progress bar advance
7. **Check console**: Press F12 and look for spawn messages like:

   ```
   [GameLogic] Spawn effect - starting object spawning
   [GameLogic] Spawning 2 objects. Total will be: 2
   [SpawnObject] Created: {id: "...", emoji: "🍎", x: 45.2, y: -100}
   ```

## Expected Console Output

### When Game Starts

```
[GameLogic] Starting game at level: 0
[GameLogic] Initial target: {name: "apple", emoji: "🍎"}
[GameLogic] Game state updated, gameStarted: true
[GameLogic] Spawn effect - starting object spawning
```

### Every 1.6 Seconds

```
[GameLogic] Spawning 1 objects. Total will be: 3
[SpawnObject] Created: {id: "...", emoji: "🍌", x: 62.4, y: -100, speed: 1.2}
```

### Every Frame (sampled at 10%)

```
[UpdateObjects] screenHeight: 969 speedMultiplier: 0.6 objectCount: 4
[UpdateObjects] First object: {id: "...", y: 245.6, speed: 1.1, emoji: "🍎"}
```

## What to Look For

### ✅ GOOD Signs

- Emojis appear within 2 seconds of starting
- New emojis spawn continuously (every 1-2 seconds)
- Spawn messages in console showing increasing object counts
- Objects move smoothly down the screen
- FPS counter (if enabled) shows 55-60fps
- No collision phasing (emojis push apart gently)

### ❌ BAD Signs

- No emojis after 5 seconds
- Console shows "not spawning" messages
- Error messages about undefined properties
- Objects spawn once then stop
- FPS drops below 45
- Emojis overlap/phase through each other

## Detailed Test Scenarios

### Test 1: Basic Spawn Functionality

1. Start game on "Fruits & Vegetables" level
2. Count: Should see 2-4 emojis within first 5 seconds
3. Wait 10 seconds: Should see 6-8 emojis total
4. **PASS IF**: Continuous spawning occurs

### Test 2: Performance Under Load

1. Let game run for 30 seconds without tapping
2. Count emojis on screen (should be 10-15 max)
3. Check FPS in PerformanceMonitor overlay
4. **PASS IF**: FPS stays above 50, no lag

### Test 3: Collision Detection

1. Watch for emojis spawning close together
2. Verify they push apart horizontally
3. Verify they DON'T jump vertically
4. **PASS IF**: Smooth separation, no phasing

### Test 4: Memory Stability

1. Play for 2 minutes continuously
2. Open browser DevTools → Performance tab
3. Check heap size stays under 100MB
4. **PASS IF**: No memory leak, stable performance

### Test 5: All Levels

1. Test each of the 9 levels
2. Verify emojis spawn for each category
3. **PASS IF**: All levels work consistently

## Debugging Failed Tests

### If No Emojis Spawn

1. **Check gameStarted state**:
   - Open React DevTools
   - Find `GameLogic` hook
   - Verify `gameState.gameStarted === true`

2. **Check spawn interval**:
   - Look for console message: `[GameLogic] Spawn effect - starting object spawning`
   - If missing, spawn effect isn't running
   - Check if `gameState.winner === true` (blocks spawning)

3. **Check category data**:
   - Console log: `GAME_CATEGORIES[0].items`
   - Should show array of emoji objects
   - If empty, data loading issue

4. **Check errors**:
   - Look for red errors in console
   - Common: `Cannot read property 'items' of undefined`
   - Fix: Verify currentCategory is defined

### If Emojis Spawn Once Then Stop

1. **Check for effect cleanup**:
   - spawn interval is being cleared too early
   - Verify `gameState.gameStarted` stays true
   - Verify `gameState.winner` stays false

2. **Check spawnObject recreation**:
   - Add console.log in spawnObject: `console.log('[SpawnObject] Function recreated')`
   - Should only log once at game start
   - If logging repeatedly, dependency issue

### If Performance Issues

1. **Check object count**:
   - Console: `gameObjects.length`
   - Should stay under 15
   - If > 20, spawn limit not working

2. **Check collision detection**:
   - Disable collision temporarily by commenting out collision block
   - If FPS improves, collision is bottleneck
   - Re-enable and increase skip distance to 100px

3. **Profile with React DevTools**:
   - Record profile during gameplay
   - Look for expensive renders
   - Common culprit: debug overlays

## Success Criteria

### Minimum Viable Fix

- ✅ Emojis spawn continuously
- ✅ Game is playable end-to-end
- ✅ No console errors

### Optimal Performance

- ✅ FPS stays 55-60
- ✅ Smooth emoji movement
- ✅ No memory leaks over 2 minutes
- ✅ All 9 levels work
- ✅ Collision detection smooth

## Rollback Plan

If optimization causes new issues:

```bash
# Revert changes
git status
git checkout src/hooks/use-game-logic.ts

# Or restore from backup
# Copy from previous commit if needed
```

**Previous working commit**: Check git log for last commit before optimization

## Contact/Questions

If tests fail or unexpected behavior:

1. Check OPTIMIZATION_SUMMARY.md for what was changed
2. Check PERFORMANCE_AUDIT_FIX.md for detailed analysis
3. Review git diff to see exact code changes
4. Test on different browser (Chrome vs Firefox vs Safari)
