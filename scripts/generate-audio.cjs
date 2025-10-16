#!/usr/bin/env node

/**
 * ElevenLabs Audio Generator for Kindergarten Race Game
 * Generates all required audio files with consistent voice
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const ELEVENLABS_API_KEY = 'sk_73a0b8afa66fd988f05a2d1c5e5cb6bdea08b5ec75978926';
const VOICE_ID = 'zmcVlqmyk3Jpn5AVYcAL';
const OUTPUT_DIR = path.join(__dirname, '..', 'sounds');

// Voice settings optimized for clear child-friendly pronunciation
const VOICE_SETTINGS = {
    stability: 0.75,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
};

// All audio files needed for the game
const AUDIO_PHRASES = [
    // Numbers 1-15 (including double digits)
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',

    // Alphabet A-Z
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',

    // Fruits & Vegetables
    'apple', 'banana', 'grapes', 'strawberry', 'carrot', 'cucumber', 'watermelon', 'broccoli',
    'orange', 'lemon', 'peach', 'cherry', 'kiwi',

    // Shapes
    'circle', 'square', 'diamond', 'triangle', 'star', 'oval', 'rectangle', 'pentagon', 'hexagon',

    // Colors
    'blue', 'red', 'orange', 'green', 'purple', 'white', 'black', 'brown', 'pink', 'yellow',

    // Animals
    'dog', 'cat', 'fox', 'turtle', 'butterfly', 'owl', 'ant', 'duck', 'elephant', 'fish',
    'giraffe', 'lion', 'mouse', 'penguin', 'rabbit', 'snake', 'tiger', 'whale', 'zebra',

    // Nature
    'tree', 'flower', 'leaf', 'sun', 'moon', 'rainbow',

    // Vehicles (Things That Go)
    'car', 'bus', 'fire truck', 'airplane', 'rocket', 'bicycle', 'helicopter', 'boat',
    'train', 'taxi', 'van', 'scooter', 'motorcycle',

    // Weather
    'sunny', 'partly cloudy', 'cloudy', 'rainy', 'stormy', 'snowy', 'tornado', 'windy',
    'foggy', 'lightning',

    // Feelings & Actions
    'happy', 'sad', 'angry', 'sleepy', 'hug', 'clap', 'dance', 'flip',
    'smile', 'laugh', 'think', 'celebrate', 'wave',

    // Body Parts
    'eye', 'ear', 'nose', 'mouth', 'tongue', 'hand', 'foot', 'leg', 'tooth',
    'arm', 'brain', 'heart',

    // Objects with emoji_ prefix for compatibility
    'emoji_apple', 'emoji_banana', 'emoji_grapes', 'emoji_watermelon', 'emoji_orange',
    'emoji_ant', 'emoji_ball', 'emoji_car', 'emoji_cat', 'emoji_dog', 'emoji_duck',
    'emoji_egg', 'emoji_elephant', 'emoji_fish', 'emoji_flower', 'emoji_giraffe',
    'emoji_hat', 'emoji_house', 'emoji_ice cream', 'emoji_iguana', 'emoji_jar', 'emoji_juice',
    'emoji_key', 'emoji_kite', 'emoji_leaf', 'emoji_lion', 'emoji_moon', 'emoji_mouse',
    'emoji_nest', 'emoji_nose', 'emoji_owl', 'emoji_penguin', 'emoji_pizza',
    'emoji_queen', 'emoji_question mark', 'emoji_rabbit', 'emoji_rainbow',
    'emoji_snake', 'emoji_sun', 'emoji_tiger', 'emoji_tree', 'emoji_umbrella', 'emoji_unicorn',
    'emoji_violin', 'emoji_volcano', 'emoji_whale', 'emoji_x-ray', 'emoji_xylophone',
    'emoji_yacht', 'emoji_yarn', 'emoji_zipper',

    // Sound effects
    'success', 'wrong', 'win', 'tap', 'explosion', 'laser',

    // Welcome messages
    'welcome'
];

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 500; // ms

/**
 * Generate audio using ElevenLabs API
 */
function generateAudio(text, outputPath) {
    return new Promise((resolve, reject) => {
        // Prepare text for speech (remove emoji_ prefix for natural pronunciation)
        const speechText = text.replace('emoji_', '').replace(/_/g, ' ');

        const postData = JSON.stringify({
            text: speechText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: VOICE_SETTINGS
        });

        const options = {
            hostname: 'api.elevenlabs.io',
            port: 443,
            path: `/v1/text-to-speech/${VOICE_ID}`,
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                let errorData = '';
                res.on('data', (chunk) => errorData += chunk);
                res.on('end', () => {
                    reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
                });
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            fileStream.on('error', (err) => {
                fs.unlink(outputPath, () => {
                    // Cleanup complete
                });
                reject(err);
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
    console.log('🎙️  ElevenLabs Audio Generator for Kindergarten Race Game');
    console.log('━'.repeat(60));
    console.log(`Voice ID: ${VOICE_ID}`);
    console.log(`Output Directory: ${OUTPUT_DIR}`);
    console.log(`Total Files to Generate: ${AUDIO_PHRASES.length}`);
    console.log('━'.repeat(60));
    console.log('');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`✓ Created output directory: ${OUTPUT_DIR}`);
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let i = 0; i < AUDIO_PHRASES.length; i++) {
        const phrase = AUDIO_PHRASES[i];
        const filename = `${phrase}.wav`;
        const outputPath = path.join(OUTPUT_DIR, filename);

        try {
            process.stdout.write(`[${i + 1}/${AUDIO_PHRASES.length}] Generating "${phrase}"...`);

            await generateAudio(phrase, outputPath);
            successCount++;

            console.log(' ✓');

            // Rate limiting
            if (i < AUDIO_PHRASES.length - 1) {
                await sleep(DELAY_BETWEEN_REQUESTS);
            }
        } catch (error) {
            failCount++;
            errors.push({ phrase, error: error.message });
            console.log(` ✗ (${error.message})`);
        }
    }

    console.log('');
    console.log('━'.repeat(60));
    console.log('📊 Generation Summary');
    console.log('━'.repeat(60));
    console.log(`✓ Success: ${successCount} files`);
    console.log(`✗ Failed: ${failCount} files`);
    console.log('');

    if (errors.length > 0) {
        console.log('❌ Failed Files:');
        errors.forEach(({ phrase, error }) => {
            console.log(`   - ${phrase}: ${error}`);
        });
        console.log('');
    }

    if (successCount > 0) {
        console.log('✅ Audio generation complete!');
        console.log(`   Generated files are in: ${OUTPUT_DIR}`);
    }

    process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
