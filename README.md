# 🐢 Kindergarten Race - Educational Game

An engaging educational racing game where two players compete by identifying falling objects to advance their turtle characters. Perfect for kindergarten students to learn pattern recognition while having fun!

## 🎮 Game Features

### Split-Screen Racing Interface

- **Two-Player Competitive Gameplay**: Side-by-side game areas with turtle characters racing to the top
- **Real-time Competition**: Players advance by correctly identifying falling objects
- **Responsive Touch Controls**: Optimized for tablets and touch devices

### Educational Categories

- **Fruits**: Learn to identify different fruits 🍎🍌🍊
- **Numbers**: Number recognition and counting 🔢
- **Alphabet**: Letter identification and phonics 📝

### Dynamic Gameplay

- **Falling Object System**: Objects continuously fall from the top with highlighted targets
- **Progressive Difficulty**: Game gets more challenging as players advance
- **Visual Feedback**: Smooth animations and celebratory effects
- **Performance Monitoring**: Built-in FPS monitoring and optimization

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd English-K1Run

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Android ARM64 / Termux Installation

If you're using Termux on Android ARM64 devices and encounter the error:
```
Error: Cannot find module @rollup/rollup-android-arm64
```

Try these solutions in order:

**Solution 1: Use the Android Install Script**
```bash
# Use the predefined Android-friendly installation
npm run install:android

# Or if that fails, use the safe installation
npm run install:safe
```

**Solution 2: Clean Install**
```bash
# Remove package-lock.json and node_modules
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall with legacy peer deps handling
npm install --legacy-peer-deps
```

**Solution 3: Use npm with optional dependencies**
```bash
# If the above fails, install without optional dependencies
npm install --no-optional

# Or skip platform-specific binaries
npm install --ignore-platform-reqs
```

**Solution 4: Alternative Installation**
```bash
# Use yarn instead of npm (often handles optional deps better)
npm install -g yarn
yarn install

# Or use pnpm
npm install -g pnpm
pnpm install
```

**Solution 5: Manual Workaround**
If all else fails, you can force install without the problematic optional dependency:
```bash
npm install --no-optional --legacy-peer-deps
```

> 📱 **For detailed Android ARM64/Termux troubleshooting, see [ANDROID_ARM64_GUIDE.md](./ANDROID_ARM64_GUIDE.md)**

### Docker Deployment (Recommended for Schools)

For easy deployment in educational environments:

```bash
# Build and run with Docker Compose (Production)
docker-compose up -d

# For development with hot reloading
docker-compose --profile dev up kindergarten-race-dev

# Or build manually
docker build -t kindergarten-race .
docker run -p 3000:80 kindergarten-race
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (requires TypeScript compilation)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom themes
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **State Management**: React hooks with custom game logic

## 🎯 Educational Goals

This game is designed to help kindergarten students develop:

- **Pattern Recognition**: Identifying objects and matching targets
- **Hand-Eye Coordination**: Precise touch interactions
- **Competitive Learning**: Healthy competition motivates engagement
- **Category Learning**: Understanding different object groups
- **Quick Decision Making**: Time-based challenges improve reaction time

## 📱 Device Compatibility

- Optimized for tablets and larger touch devices
- Responsive design adapts to different screen sizes
- Multi-touch support for simultaneous players
- 60fps gameplay for smooth experience

## 🎨 Customization

The game includes various customizable features:

- Adjustable difficulty levels
- Different visual themes
- Performance optimization settings
- Debug and monitoring tools for educators

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
