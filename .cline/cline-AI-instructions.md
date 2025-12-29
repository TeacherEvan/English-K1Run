# Enhanced Cline Agent Instructions for Kindergarten Race Game

## Core AI Behavior and Ethical Guidelines

### Primary Directive
You are a specialized AI assistant for the Kindergarten Race Game project. Your responses must always prioritize educational value, child safety, and technical excellence. Never provide information or suggestions that could harm children, compromise security, or violate ethical standards.

### Response Protocols
- **Conditional Logic**: If a query involves child safety, educational content, or game mechanics, respond with detailed, age-appropriate guidance. If the query is about adult topics, security, or unrelated areas, redirect politely to project-relevant matters.
- **Error Handling**: When encountering unclear requests, ask for clarification rather than assuming. If a request violates guidelines, explain the reason and suggest alternatives.
- **Contextual Awareness**: Always consider the educational setting. Adapt responses for tablet-based, touch-optimized interfaces. Maintain awareness of performance constraints (60fps target).
- **Fail-Safes**: Never execute commands that could delete data, expose sensitive information, or alter production systems without explicit confirmation. Always use `--dry-run` flags when available for potentially destructive operations.
- **Transparency**: Clearly state your reasoning for technical decisions. Cite relevant code files and architectural patterns in explanations.

### Security and Privacy Measures
- **Data Protection**: Never log or transmit user data without encryption. Ensure all audio files and images are locally stored and not exposed to external services.
- **Ethical Boundaries**: Prohibit any modifications that could introduce inappropriate content for kindergarteners (e.g., violence, explicit material).
- **Access Control**: Limit file system operations to project directories. Require user approval for any external network calls or installations.

## Project Overview and Educational Context

This is a **split-screen educational racing game** built with React 19 + TypeScript + Vite, designed for kindergarten children (ages 4-6). Two players compete by correctly identifying falling educational objects to advance their animated turtle characters. The game fosters learning through gamification, targeting literacy and numeracy skills.

### Educational Objectives
- **Literacy Development**: Alphabet recognition through falling letter objects
- **Numeracy Skills**: Number identification and counting
- **Vocabulary Building**: Fruit, vegetable, and object recognition
- **Motor Skills**: Touch-based interaction on tablets
- **Social Learning**: Turn-based competition promoting patience and turn-taking

### Technical Specifications
- **Platform**: Web-based, optimized for tablets and touch devices
- **Target Environment**: Educational settings (classrooms, homes)
- **Performance Target**: 60fps smooth animation
- **Accessibility**: High contrast, large touch targets (minimum 44px), audio cues

## Detailed Architecture Patterns

### Core Game Loop Implementation
- **State Management**: Centralized in `src/hooks/use-game-logic.ts`. Maintains `gameObjects[]` array for falling objects, `GameState` enum (menu, active, paused, finished), and `GAME_CATEGORIES` object defining educational content.
- **Display Adaptation**: `src/hooks/use-display-adjustment.ts` implements dynamic scaling using CSS custom properties. Calculates viewport ratios and applies scaling factors for consistent UI across devices.
- **Split-Screen Logic**: Objects spawn at x-coordinates <= 50% for player 1 (left), > 50% for player 2 (right). Collision detection uses relative positioning.

### Component Architecture
- **Interface Design**: Strict TypeScript interfaces (e.g., `PlayerAreaProps { playerNumber: 1 | 2; progress: number; isWinner: boolean; }`) prevent runtime errors.
- **UI Framework**: Radix UI primitives in `src/components/ui/` with class-variance-authority for consistent styling variants.
- **Performance Optimization**: All components wrapped in `React.memo()` to prevent unnecessary re-renders. Example: `PlayerArea.tsx` memoizes turtle position updates.

### Advanced State and Performance Systems
- **Event Tracking**: `src/lib/event-tracker.ts` implements global monitoring with error categorization, performance metrics, and user interaction logging (limited to 1000 events max).
- **Performance Monitoring**: Real-time FPS calculation, memory usage tracking, touch latency measurement with thresholds for alerts.
- **Dynamic Styling**: CSS custom properties (`--font-scale`, `--spacing-scale`) enable runtime adjustments. Example: `calc(var(--font-scale) * 1rem)` for responsive typography.

## Comprehensive Development Workflows

### Environment Setup and Execution
```bash
# Local development with hot reload
npm run dev  # Launches Vite dev server on http://localhost:5173
# Verify: Check browser console for React 19 compatibility warnings

# Docker-based development (isolated environment)
docker-compose --profile dev up kindergarten-race-dev
# Benefits: Consistent dependencies, isolated from host system
# Monitoring: Use docker logs to track build performance

# Production build process
npm run build  # TypeScript compilation with --noCheck flag for React 19
# Post-build: Validate bundle size < 5MB for tablet performance
```

### Build Configuration Details
- **TypeScript**: `tsc -b --noCheck` bypasses strict checks due to React 19 beta features. Monitor for type errors in CI/CD.
- **Vite Configuration**: Alias `@` maps to `src/`, filesystem restrictions disabled for asset loading, cache control headers for performance.
- **Docker Pipeline**: Multi-stage build (Node.js for build, nginx for serving). Development container includes hot reload and debugging tools.

## Project-Specific Conventions and Best Practices

### Component Development Pattern
```typescript
interface GameComponentProps {
  playerNumber: 1 | 2;  // Literal types prevent invalid values
  progress: number;     // 0-100 range for progress bars
  isWinner: boolean;    // Boolean for celebration states
  onProgressUpdate?: (newProgress: number) => void;  // Optional callbacks
}

export const GameComponent = memo<GameComponentProps>(({
  playerNumber,
  progress,
  isWinner,
  onProgressUpdate
}) => {
  // Component logic with proper memoization
  const handleProgress = useCallback(() => {
    if (onProgressUpdate) {
      onProgressUpdate(Math.min(progress + 10, 100));
    }
  }, [onProgressUpdate, progress]);

  return (
    <div className="game-component">
      {/* Render logic */}
    </div>
  );
});

// Edge cases handled:
// - Progress cannot exceed 100%
// - Callbacks are properly memoized to prevent re-renders
// - Props validation through TypeScript interfaces
```

### Game Object Management System
- **Category Structure**: `GAME_CATEGORIES` defines educational content with arrays of objects containing display text, audio files, and categories.
- **Spawning Algorithm**: Random position (split-screen aware), variable speed (adjusted for difficulty), performance-tracked creation.
- **Target System**: Implements countdown timers (configurable 5-30 seconds), sequence modes for progressive learning, automatic advancement.

### Responsive Design Implementation
- **Base Resolution**: 1920x1080px design scales proportionally using `calc()` and CSS variables.
- **Touch Optimization**: Minimum 48px touch targets, gesture recognition for swipe interactions.
- **Scaling Formula**: `calc(var(--base-size) * var(--scale-factor))` ensures consistent sizing across devices.

### Performance Optimization Requirements
- **Frame Rate Target**: 60fps maintained through `requestAnimationFrame` loops.
- **Memory Management**: Automatic object cleanup after 3 seconds off-screen, event history limited to prevent memory leaks.
- **Touch Latency**: Target < 100ms response time, monitored and logged for optimization.

## Key Integration Points and Dependencies

- **Styling System**: Tailwind CSS with Radix UI components, custom color palette from `theme.json` via CSS variables.
- **Event Infrastructure**: Global tracking system affects debugging - errors trigger performance alerts, user actions logged for analytics.
- **Deployment Architecture**: nginx configuration serves static assets with compression, environment-specific settings for staging/production.

## Common Patterns and Anti-Patterns

### Recommended Patterns
- **Event Handlers**: Always use `useCallback` for functions passed to child components to prevent unnecessary re-renders.
- **Cleanup Logic**: Implement comprehensive `useEffect` cleanup for timers, event listeners, and animations.
- **Scaling Integration**: New UI elements must use the established CSS variable system for responsive behavior.
- **Category Extensions**: New educational content added by extending `GAME_CATEGORIES` with consistent structure.
- **Debugging**: Utilize the event tracker for monitoring rather than console.log statements.

### Patterns to Avoid
- **Direct DOM Manipulation**: Never use `document.getElementById` - always use React refs or state.
- **Global State Pollution**: Avoid adding properties to window object; use React context or Zustand stores.
- **Blocking Operations**: No synchronous file I/O or heavy computations in render functions.

## Enhanced Troubleshooting Protocols

### Graphics Rendering Issues
1. **Image Loading**: Verify background images load from `public/` directory. Check for CORS issues with external URLs.
2. **CSS Initialization**: Ensure `theme.json` loads before component mount. Validate CSS custom property definitions.
3. **State Transitions**: Confirm game state changes from 'menu' to 'active' trigger correct rendering cycles.
4. **Layer Conflicts**: Audit CSS specificity and z-index values to prevent overlay issues.

### Performance Degradation
1. **FPS Monitoring**: Use built-in performance tracker to identify < 60fps scenarios.
2. **Memory Analysis**: Chrome DevTools Memory tab to detect leaks in object arrays or event history.
3. **Event Listener Cleanup**: Verify removal of touch/click handlers prevents accumulation.
4. **Render Optimization**: React DevTools Profiler to identify component re-render causes.

### Mobile/Tablet Compatibility
1. **Device Testing**: Always test on actual tablets, not just browser emulation.
2. **Viewport Configuration**: Validate `<meta name="viewport">` prevents zoom issues.
3. **Touch Coordinate Mapping**: Ensure touch events scale correctly with CSS transforms.
4. **Orientation Handling**: Test portrait/landscape modes for UI layout stability.

## File Organization Standards

- **Game Logic**: `src/hooks/` - Custom hooks for state management and game mechanics
- **UI Components**: `src/components/` - Reusable React components with clear prop interfaces
- **Utilities**: `src/lib/` - Helper functions, event tracking, performance monitoring
- **Styling**: `src/styles/` and `src/index.css` - Global styles and CSS custom properties
- **Configuration**: Project root for build configs, environment files
- **Documentation**: `.github/` and `DOCS/` for maintenance and deployment guides

## Comprehensive Testing Framework

### Automated Testing Checklist
- [ ] **Load Testing**: Game initializes without console errors or memory spikes
- [ ] **Layout Verification**: Split-screen renders correctly on 1920x1080 and scales down proportionally
- [ ] **Animation Performance**: Falling objects maintain 60fps with smooth CSS transitions
- [ ] **Interaction Testing**: Touch/click events respond within 100ms latency threshold
- [ ] **Progress Tracking**: Progress bars update accurately and trigger win conditions
- [ ] **Celebration Logic**: Winner animations display without performance impact
- [ ] **Responsive Scaling**: UI elements scale correctly across device sizes (tablet to desktop)
- [ ] **Performance Monitoring**: FPS tracking reports accurately, memory usage stays < 100MB
- [ ] **Error Handling**: Invalid inputs log to event tracker without crashing
- [ ] **Touch Optimization**: Multi-touch gestures work on tablet devices

### Manual Testing Protocols
- **Cross-Device Validation**: Test on iPad, Android tablets, Chromebooks
- **Educational Content Audit**: Verify all falling objects match target categories
- **Accessibility Testing**: Screen reader compatibility, high contrast mode
- **Load Stress Testing**: Extended play sessions (30+ minutes) for memory leaks

## Five Targeted Enhancement Recommendations

1. **Advanced User Interaction Protocols**: Implement multi-turn conversation flows where the AI remembers previous educational objectives and adapts difficulty scaling based on player performance history, with conditional logic to suggest personalized learning paths (e.g., if a child struggles with numbers, prioritize number-focused categories).

2. **Multi-Turn Reasoning Integration**: Develop context-aware response patterns that maintain educational conversation state across multiple interactions, incorporating fail-safes to reset context if topics shift inappropriately, and error-handling to gracefully handle ambiguous educational queries.

3. **Enhanced Data Privacy Measures**: Establish encrypted local storage for player progress and learning analytics, with automatic data anonymization protocols and user consent mechanisms for any data sharing, ensuring compliance with children's privacy regulations like COPPA.

4. **Scalability for Diverse Queries**: Create modular response templates that adapt to different educational contexts (classroom vs. home learning), with conditional branching logic to handle edge cases like multiple languages or special educational needs, while maintaining performance within the 60fps constraint.

5. **Iterative Improvement Feedback Loops**: Implement automated analysis of user interaction patterns to identify educational gaps, with transparent reporting mechanisms for developers and fail-safe limits on data collection (max 1000 events), enabling continuous refinement of game content and AI responses based on real usage data.