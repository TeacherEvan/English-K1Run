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
- **Beautiful Backgrounds**: 10 rotating scenic backgrounds including galaxies, waterfalls, cherry blossoms, and colorful architecture

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

### 📱 Mobile Development with Termux

#### Complete Termux Setup Guide for Android

Termux is a powerful terminal emulator for Android that allows you to run this React game directly on your mobile device. Follow this comprehensive guide to set up your development environment:

**Step 1: Install Termux**

```bash
# Download Termux from F-Droid (recommended) or Google Play Store
# F-Droid version: https://f-droid.org/packages/com.termux/
```

**Step 2: Update Termux and Install Essential Packages**

```bash
# Update package lists
pkg update && pkg upgrade

# Install essential development tools
pkg install git nodejs-lts python make clang

# Verify Node.js installation
node --version
npm --version
```

**Step 3: Clone and Setup the Project**

```bash
# Clone the repository
git clone <repository-url>
cd English-K1Run

# Give Termux storage permissions (if needed)
termux-setup-storage
```

**Step 4: Install Dependencies (Android ARM64 Compatible)**

If you encounter the `@rollup/rollup-android-arm64` error, try these solutions in order:

**Quick Fix (Recommended)**

```bash
# Use the built-in Android install script
npm run install:android

# Or if that fails, use the safe installation
npm run install:safe
```

**Alternative Methods**

```bash
# Method 1: Clean install with legacy peer deps
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Method 2: Skip optional dependencies
npm install --no-optional

# Method 3: Use yarn (often better ARM64 support)
npm install -g yarn
yarn install

# Method 4: Use pnpm
npm install -g pnpm
pnpm install
```

**Step 5: Start Development Server**

```bash
# Start the dev server (accessible on mobile browser)
npm run dev

# The game will be available at:
# http://localhost:5173
```

**Step 6: Access on Mobile Browser**

- Open Chrome/Firefox on your Android device
- Navigate to `http://localhost:5173`
- For best experience, add to home screen for full-screen mode

#### Termux Optimization Tips

**Performance Optimization:**

```bash
# Increase memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=2048"

# Use fewer CPU cores if facing memory issues
export UV_THREADPOOL_SIZE=2
```

**Storage Management:**

```bash
# Monitor storage usage
df -h $PREFIX

# Clean npm cache if needed
npm cache clean --force

# Clean Termux package cache
pkg clean
```

**Network Considerations:**

```bash
# If experiencing slow downloads, use different npm registry
npm config set registry https://registry.npmmirror.com/

# Reset to default registry later
npm config set registry https://registry.npmjs.org/
```

> 📱 **For detailed Android ARM64/Termux troubleshooting, see [ANDROID_ARM64_GUIDE.md](./ANDROID_ARM64_GUIDE.md)**

#### Troubleshooting Common Termux Issues

**Issue: Permission Denied**

```bash
# Fix permission issues
termux-setup-storage
chmod +x node_modules/.bin/*
```

**Issue: Out of Memory**

```bash
# Reduce build concurrency
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build -- --max-old-space-size=1024
```

**Issue: Port Already in Use**

```bash
# Kill process using port 5173
pkill -f "vite"
# Or use a different port
npm run dev -- --port 3000
```

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
