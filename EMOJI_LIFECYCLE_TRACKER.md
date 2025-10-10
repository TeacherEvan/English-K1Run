# Emoji Lifecycle Tracker - Usage Guide

## Overview

The Emoji Lifecycle Tracker is a diagnostic tool that monitors and visualizes the complete lifecycle of emojis (falling objects) in the game. It tracks the first 10 emojis spawned and logs every phase they go through, helping diagnose timing issues, rendering problems, and interaction bugs.

## Features

### Lifecycle Phases Tracked

1. **🌱 Spawned** - When the emoji object is created and added to the game
2. **🎨 Rendered** - When the emoji is rendered to the DOM (not yet implemented in FallingObject component)
3. **👁️ Visible** - When the emoji becomes visible on screen (not yet implemented)
4. **👆 Tapped** - When a player successfully taps the emoji
5. **🗑️ Removed** - When the emoji is removed after being tapped
6. **❌ Missed** - When the emoji falls off screen without being tapped

### Information Displayed

For each tracked emoji, the tracker shows:

- **Emoji and name** (e.g., 🍎 apple)
- **Object ID** (truncated for readability)
- **Status badge** (✓ Completed or ⏳ Active)
- **Total duration** from spawn to removal
- **Phase timeline** with timestamps and durations
- **Position coordinates** (x, y) at each phase
- **Player side** (left or right)
- **Additional data** (correct/incorrect tap, tap latency, etc.)

## How to Use

### 1. Open the Tracker

The tracker appears as a purple button in the **bottom-left corner** of the screen:

```
📊 Emoji Lifecycle
```

Click it to expand the full tracker panel.

### 2. Start Tracking

1. Click **▶️ Start Tracking** button
2. The tracker will monitor the **first 10 emojis** that spawn
3. A green badge shows **🟢 Recording** status
4. Console will log: `[EmojiTracker] Lifecycle tracking enabled - will track first 10 emojis`

### 3. Play the Game

Start a game level and the tracker will automatically capture:

- When emojis spawn
- When they're tapped (correct or incorrect)
- When they're removed
- When they fall off screen

### 4. View Lifecycle Data

Each tracked emoji displays:

```
#1 🍎 apple ✓ Completed     1234ms total
ID: obj-12345...

🌱 spawned    +0ms     (45.2, -120.0) [left]
👆 tapped     +856ms   (45.2, 234.5)  [left] {"isCorrect":true,"tapLatency":2.3}
🗑️ removed    +858ms   (45.2, 234.5)  [left] {"reason":"tapped","isCorrect":true}
```

### 5. Control Playback

- **⏸️ / ▶️** - Pause/resume auto-refresh (updates every 500ms)
- **🔄** - Manual refresh
- **🗑️ Clear** - Clear all tracked data
- **⏹️ Stop Tracking** - Stop recording new emojis
- **➖** - Minimize to button

### 6. Interpret Results

**Healthy Lifecycle Example:**

```
🌱 spawned → 👆 tapped → 🗑️ removed
```

Total time: ~800-2000ms (normal gameplay)

**Missed Object:**

```
🌱 spawned → ❌ missed
```

Total time: ~3000-5000ms (fell off screen)

**Performance Issue Indicators:**

- Very short spawn-to-tap time (<200ms) - might indicate object spawning too close
- Very long spawn-to-tap time (>5000ms) - slow gameplay or difficult target
- Many "missed" phases - objects falling too fast or spawn rate too high

## Developer Console Output

When tracking is enabled, detailed logs appear in the console:

```
[EmojiTracker #1/10] SPAWNED: 🍎 apple (0ms) at (45.2, -120.0) [left]
[EmojiTracker #1/10] TAPPED: 🍎 apple (856ms) at (45.2, 234.5) [left] {isCorrect: true, tapLatency: 2.3}
[EmojiTracker #1/10] REMOVED: 🍎 apple (858ms) at (45.2, 234.5) [left] {reason: "tapped", isCorrect: true}
```

## API Reference

### Event Tracker Methods

```typescript
// Enable/disable lifecycle tracking
eventTracker.enableLifecycleTracking(true)

// Track a lifecycle event
eventTracker.trackEmojiLifecycle({
  objectId: 'obj-123',
  emoji: '🍎',
  name: 'apple',
  phase: 'spawned',
  position: { x: 45, y: -120 },
  playerSide: 'left',
  data: { any: 'extra info' }
})

// Get lifecycle for specific object
const lifecycle = eventTracker.getEmojiLifecycle('obj-123')

// Get all tracked lifecycles
const all = eventTracker.getAllEmojiLifecycles()

// Get statistics
const stats = eventTracker.getLifecycleStats()

// Clear tracking data
eventTracker.clearLifecycleTracking()
```

### Integration Points

The tracker automatically hooks into:

1. **`use-game-logic.ts` - `spawnObject()`**
   - Tracks `spawned` phase when new emojis are created
   - Captures initial position and player side

2. **`use-game-logic.ts` - `handleObjectTap()`**
   - Tracks `tapped` phase when player interacts
   - Records tap correctness, latency, and position

3. **`use-game-logic.ts` - `handleObjectTap()` cleanup**
   - Tracks `removed` phase after tap
   - Marks reason as "tapped"

4. **`use-game-logic.ts` - `updateObjects()`**
   - Tracks `missed` phase for objects falling off screen
   - Marks reason as "fell_off_screen"

## Troubleshooting

### Tracker Not Recording

**Issue**: Tracker shows "Waiting for emojis to spawn..."

**Solutions**:

1. Make sure you clicked **▶️ Start Tracking** before starting the game
2. Start a game level - tracking only happens during active gameplay
3. Check console for `[EmojiTracker] Lifecycle tracking enabled` message

### Missing Phases

**Issue**: Some lifecycle phases don't appear

**Expected**: Currently only `spawned`, `tapped`, `removed`, and `missed` are implemented.

**Not Yet Implemented**:

- `rendered` phase - requires FallingObject component integration
- `visible` phase - requires viewport intersection observer

### Console is Noisy

**Issue**: Too many console logs

**Solution**: The tracker logs to console for development. In production builds, these are automatically suppressed. To reduce logs during development, set auto-refresh to pause (⏸️ button).

## Performance Impact

- **Minimal**: Only tracks first 10 emojis
- **Automatic cleanup**: Stops tracking after 10 emojis
- **Lazy loaded**: Component only loads when needed
- **No gameplay impact**: All tracking happens asynchronously

## Best Practices

1. **Start tracking BEFORE starting the game** - Ensures you capture the first spawns
2. **Pause auto-refresh** when analyzing data to prevent UI changes
3. **Clear data between tests** for clean diagnostic runs
4. **Check console logs** for detailed timing information
5. **Export data** (planned feature) for sharing with other developers

## Future Enhancements

Planned features:

- [ ] Export lifecycle data to JSON
- [ ] Track `rendered` phase in FallingObject component
- [ ] Track `visible` phase using intersection observer
- [ ] Visualize timeline on graph
- [ ] Compare lifecycles between different levels
- [ ] Track frame-by-frame position updates
- [ ] Heatmap of spawn positions
- [ ] Statistics dashboard (avg tap time, miss rate, etc.)

## Example Use Cases

### Debugging Spawn Timing

Start tracker, play game, check if `spawned` phases are evenly distributed or bunched together.

### Analyzing Tap Latency

Look at the `data` field in `tapped` phase to see `tapLatency` values. High values (>50ms) indicate performance issues.

### Finding Collision Issues

Check x/y positions in `spawned` phase. If objects spawn at same coordinates, collision detection may have failed.

### Testing Fall Speed

Measure time from `spawned` to `missed` for objects that fall off screen. Adjust `fallSpeedMultiplier` if too fast/slow.

---

**Developer**: This tracker is designed for development and debugging only. Disable or remove in production builds for optimal performance.
