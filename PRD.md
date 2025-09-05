# Kindergarten Race - Educational Racing Game

Create an engaging educational racing game where two players compete by identifying falling objects to advance their turtle characters.

**Experience Qualities**:
1. **Playful** - Bright colors and smooth animations create a joyful learning environment
2. **Competitive** - Split-screen racing motivates engagement between players
3. **Educational** - Pattern recognition and category learning disguised as fun gameplay

**Complexity Level**: Light Application (multiple features with basic state)
- Multi-touch gameplay with persistent game state and progressive difficulty levels

## Essential Features

### Split-Screen Racing Interface
- **Functionality**: Two vertical game areas with turtle characters that advance upward
- **Purpose**: Enables competitive play between two kindergarten students
- **Trigger**: Game starts immediately on page load
- **Progression**: Game loads → Players see falling objects → Tap correct items → Turtles advance → First to top wins
- **Success criteria**: Smooth 60fps gameplay with responsive touch handling

### Falling Object System
- **Functionality**: Objects continuously fall from top with current target highlighted
- **Purpose**: Creates dynamic gameplay while teaching pattern recognition
- **Trigger**: Automatic after game initialization
- **Progression**: Objects spawn → Fall at steady rate → Players tap correct ones → New target appears every 10s
- **Success criteria**: Consistent object generation with clear visual feedback

### Educational Categories
- **Functionality**: Three progressively challenging categories (Fruits, Numbers, Alphabet)
- **Purpose**: Teaches recognition and sequencing skills appropriate for kindergarten
- **Trigger**: Level progression after winning a race
- **Progression**: Start with fruits → Numbers/shapes → Alphabet sequencing challenge
- **Success criteria**: Clear category differentiation with appropriate difficulty scaling

## Edge Case Handling
- **Touch Conflicts**: Prevent cross-player touch interference through position-based detection
- **Performance Issues**: Smooth degradation if frame rate drops below acceptable threshold
- **Incorrect Taps**: Visual feedback for wrong answers without punishing gameplay flow
- **Device Orientation**: Lock to landscape mode for optimal split-screen experience

## Design Direction
The design should feel playful and energetic like a children's educational app - bright primary colors, smooth bouncy animations, and friendly cartoon-style graphics that make learning feel like play rather than work. Minimal interface with maximum focus on the racing action.

## Color Selection
Triadic color scheme using three equally spaced colors to create vibrant, high-energy educational environment perfect for engaging young learners.

- **Primary Color**: Bright Blue (oklch(0.65 0.25 240)) - Main UI elements and Player 1 theme, communicates trust and focus
- **Secondary Colors**: 
  - Sunny Yellow (oklch(0.8 0.18 85)) - Player 2 theme and positive feedback
  - Forest Green (oklch(0.6 0.15 140)) - Success states and turtle characters
- **Accent Color**: Vibrant Orange (oklch(0.7 0.2 45)) - Call-to-action elements, target highlights, and winning celebrations
- **Foreground/Background Pairings**: 
  - Background (White #FFFFFF): Dark Blue text (oklch(0.3 0.1 240)) - Ratio 7.2:1 ✓
  - Primary (Bright Blue): White text (#FFFFFF) - Ratio 4.8:1 ✓
  - Secondary (Sunny Yellow): Dark Blue text (oklch(0.3 0.1 240)) - Ratio 8.1:1 ✓
  - Accent (Vibrant Orange): White text (#FFFFFF) - Ratio 4.9:1 ✓

## Font Selection
Clean, rounded sans-serif typography that feels friendly and approachable for young children while maintaining excellent readability on large touchscreens.

- **Typographic Hierarchy**:
  - H1 (Game Title): Fredoka Bold/32px/tight letter spacing
  - H2 (Target Display): Fredoka Medium/24px/normal spacing
  - Body (UI Elements): Fredoka Regular/18px/relaxed spacing
  - Small (Score/Timer): Fredoka Regular/14px/normal spacing

## Animations
Gentle, bouncy animations that feel organic and responsive - turtle movement should feel alive and celebratory, object falling should be smooth and predictable, with delightful micro-interactions that reward correct answers.

- **Purposeful Meaning**: Animations communicate game state and provide immediate feedback for educational success
- **Hierarchy of Movement**: Turtle advancement takes priority, followed by target highlights, then ambient falling objects

## Component Selection
- **Components**: Card for game areas, Button for restart/level selection, Progress for turtle advancement, Badge for current targets
- **Customizations**: Custom turtle character sprites, falling object animations, split-screen layout component
- **States**: Button states for game control, visual feedback for correct/incorrect taps, turtle animation states
- **Icon Selection**: Simple emoji-style representations for educational objects (🍎🐛🔤123)
- **Spacing**: Generous 16px base unit with 8px micro-spacing for child-friendly touch targets
- **Mobile**: Full-screen landscape layout with touch-optimized 60px minimum tap targets