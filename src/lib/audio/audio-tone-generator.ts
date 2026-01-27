/**
 * Audio Tone Generator Module
 *
 * Generates simple audio tones as fallback effects.
 * Split from audio-loader.ts for better organization.
 *
 * @module audio/audio-tone-generator
 */

/**
 * Create a simple tone with an envelope
 */
export function createTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const frameCount = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    const time = i / sampleRate;
    let sample = 0;

    switch (type) {
      case "square":
        sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1;
        break;
      case "triangle":
        sample =
          2 *
            Math.abs(
              2 * (frequency * time - Math.floor(frequency * time + 0.5)),
            ) -
          1;
        break;
      default:
        sample = Math.sin(2 * Math.PI * frequency * time);
        break;
    }

    // Apply envelope to prevent clicks
    const envelope = Math.min(time * 10, 1, (duration - time) * 10);
    channelData[i] = sample * envelope * 0.3;
  }

  return buffer;
}

/**
 * Create a sequence of tones (for more complex effects)
 */
export function createToneSequence(
  audioContext: AudioContext,
  notes: { frequency: number; duration: number }[],
): AudioBuffer {
  const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
  const sampleRate = audioContext.sampleRate;
  const frameCount = Math.max(1, Math.floor(sampleRate * totalDuration));
  const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  let currentFrame = 0;
  for (const note of notes) {
    const noteFrames = Math.max(1, Math.floor(sampleRate * note.duration));
    for (let i = 0; i < noteFrames; i++) {
      const time = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * note.frequency * time);
      const envelope = Math.min(time * 20, 1, (note.duration - time) * 10);

      if (currentFrame + i < frameCount) {
        channelData[currentFrame + i] = sample * envelope * 0.2;
      }
    }
    currentFrame += noteFrames;
  }

  return buffer;
}

/**
 * Create standard fallback effects using tones
 */
export function createFallbackEffects(
  audioContext: AudioContext,
): Map<string, AudioBuffer> {
  const fallbackEffects = new Map<string, AudioBuffer>();

  fallbackEffects.set(
    "success",
    createToneSequence(audioContext, [
      { frequency: 523.25, duration: 0.15 },
      { frequency: 659.25, duration: 0.15 },
      { frequency: 783.99, duration: 0.3 },
    ]),
  );

  fallbackEffects.set("tap", createTone(audioContext, 800, 0.1, "square"));

  fallbackEffects.set(
    "wrong",
    createToneSequence(audioContext, [
      { frequency: 400, duration: 0.15 },
      { frequency: 300, duration: 0.15 },
      { frequency: 200, duration: 0.2 },
    ]),
  );

  fallbackEffects.set(
    "win",
    createToneSequence(audioContext, [
      { frequency: 523.25, duration: 0.2 },
      { frequency: 659.25, duration: 0.2 },
      { frequency: 783.99, duration: 0.2 },
      { frequency: 1046.5, duration: 0.4 },
    ]),
  );

  return fallbackEffects;
}
