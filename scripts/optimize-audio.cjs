const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOUNDS_DIR = path.join(__dirname, '../sounds');
const BACKUP_DIR = path.join(__dirname, '../sounds/originals');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const files = fs.readdirSync(SOUNDS_DIR);
const wavFiles = files.filter(file => file.toLowerCase().endsWith('.wav'));

console.log(`Found ${wavFiles.length} WAV files to convert.`);

let successCount = 0;
let errorCount = 0;

wavFiles.forEach((file, index) => {
    const inputPath = path.join(SOUNDS_DIR, file);
    const outputFilename = file.replace(/\.wav$/i, '.mp3');
    const outputPath = path.join(SOUNDS_DIR, outputFilename);
    const backupPath = path.join(BACKUP_DIR, file);

    console.log(`[${index + 1}/${wavFiles.length}] Converting ${file}...`);

    try {
        // Convert to MP3 (128k bitrate is usually sufficient for speech/sfx)
        execSync(`ffmpeg -y -i "${inputPath}" -codec:a libmp3lame -qscale:a 4 "${outputPath}"`, { stdio: 'ignore' });
        
        // Move original to backup
        fs.renameSync(inputPath, backupPath);
        
        successCount++;
    } catch (error) {
        console.error(`Failed to convert ${file}:`, error.message);
        errorCount++;
    }
});

console.log(`Conversion complete.`);
console.log(`Success: ${successCount}`);
console.log(`Errors: ${errorCount}`);
console.log(`Original WAV files moved to: ${BACKUP_DIR}`);
