#!/usr/bin/env node

/**
 * Background Image Downloader
 * Downloads beautiful scenery images from Unsplash API for game backgrounds
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // You'll need to get this from unsplash.com/developers
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'backgrounds');
const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1080;

// Ensure backgrounds directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Beautiful scenery search terms for diverse backgrounds
const SCENERY_KEYWORDS = [
  'mountain sunrise landscape',
  'ocean waves sunset beach',
  'forest trail green nature',
  'lavender field purple flowers',
  'aurora borealis northern lights'
];

// Fallback high-quality images from free sources (no API key required)
const FALLBACK_IMAGES = [
  {
    name: 'mountain-sunrise',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Mountain sunrise with golden light'
  },
  {
    name: 'ocean-sunset',
    url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Ocean waves at sunset'
  },
  {
    name: 'forest-path',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Peaceful forest trail'
  },
  {
    name: 'lavender-field',
    url: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Purple lavender field'
  },
  {
    name: 'aurora-night',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Aurora borealis in night sky'
  },
  // NEW BACKGROUNDS - Added Nov 2025
  {
    name: 'nebula-galaxy',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Colorful nebula galaxy in deep space'
  },
  {
    name: 'tropical-waterfall',
    url: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Tropical waterfall in lush jungle'
  },
  {
    name: 'colorful-buildings',
    url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Colorful pastel buildings in Burano Italy'
  },
  {
    name: 'cherry-blossom',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Beautiful pink cherry blossom trees'
  },
  {
    name: 'starry-art',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&h=1080&fit=crop&crop=entropy&auto=format&q=80',
    description: 'Colorful abstract art museum gallery'
  }
];

/**
 * Download image from URL
 */
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(PUBLIC_DIR, filename));

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(path.join(PUBLIC_DIR, filename), () => { }); // Delete incomplete file
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Download all fallback images
 */
async function downloadFallbackImages() {
  console.log('🖼️  Downloading beautiful scenery backgrounds...\n');

  for (const image of FALLBACK_IMAGES) {
    try {
      const filename = `${image.name}.jpg`;
      const filepath = path.join(PUBLIC_DIR, filename);

      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipped (already exists): ${filename}`);
        continue;
      }

      console.log(`⬇️  Downloading: ${image.description}`);
      await downloadImage(image.url, filename);

      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Failed to download ${image.name}:`, error.message);
    }
  }
}

/**
 * Generate CSS for new backgrounds
 */
function generateBackgroundCSS() {
  const cssPath = path.join(__dirname, '..', 'src', 'backgrounds-real.css');

  const css = `/* Real Image Backgrounds - Generated automatically */

.app-bg-mountain-sunrise {
  background-image: url('/backgrounds/mountain-sunrise.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  /* Subtle overlay for better text readability */
  position: relative;
}

.app-bg-mountain-sunrise::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 1;
}

.app-bg-ocean-sunset {
  background-image: url('/backgrounds/ocean-sunset.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
}

.app-bg-ocean-sunset::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 1;
}

.app-bg-forest-path {
  background-image: url('/backgrounds/forest-path.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
}

.app-bg-forest-path::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 1;
}

.app-bg-lavender-field {
  background-image: url('/backgrounds/lavender-field.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
}

.app-bg-lavender-field::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 1;
}

.app-bg-aurora-night {
  background-image: url('/backgrounds/aurora-night.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
}

.app-bg-aurora-night::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 1;
}

/* Ensure game content appears above background overlays */
.app > * {
  position: relative;
  z-index: 2;
}

/* Optional: Add subtle animation to backgrounds */
.app-bg-animated {
  animation: gentle-zoom 20s ease-in-out infinite alternate;
}

@keyframes gentle-zoom {
  0% {
    transform: scale(1.0);
  }
  100% {
    transform: scale(1.05);
  }
}
`;

  fs.writeFileSync(cssPath, css);
  console.log(`\n📝 Generated CSS file: ${cssPath}`);
}

/**
 * Main function
 */
async function main() {
  try {
    await downloadFallbackImages();
    generateBackgroundCSS();

    console.log('\n🎉 Successfully downloaded all background images!');
    console.log('\n📋 Next steps:');
    console.log('1. Import the new CSS file in your main.css');
    console.log('2. Update the BACKGROUND_CLASSES array in App.tsx');
    console.log('3. Test the new backgrounds in your game');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();