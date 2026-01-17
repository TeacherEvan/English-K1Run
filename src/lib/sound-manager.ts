// Sound Manager - Enhanced audio system that supports wav and mp3 assets and speech-like cues

import { describeIfEnabled } from "./audio/audio-accessibility";
import { audioSpritePlayer } from "./audio/audio-sprite";
import { speechSynthesizer } from "./audio/speech-synthesizer";
import type { SupportedLanguage } from "./constants/language-config";
import { getLanguageConfig } from "./constants/language-config";
import { getSentenceTemplate } from "./constants/sentence-templates";
import { eventTracker } from "./event-tracker";
import { LRUCache } from "./utils/lru-cache";

declare global {
  interface Window {
    __audioDebug?: {
      active: number;
      peak: number;
      lastSound?: string;
    };
  }
}

const rawAudioFiles = import.meta.glob(
  "../../sounds/*.{wav,mp3,ogg,m4a,aac,flac}",
  {
    import: "default",
    query: "?url",
  },
) as Record<string, () => Promise<string>>;

// Audio priority levels for progressive loading
enum AudioPriority {
  CRITICAL = 0, // Welcome screen, essential UI sounds
  COMMON = 1, // Numbers 1-10, common letters, basic words
  RARE = 2, // Weather, vehicles, complex words, special effects
}

// Define audio files by priority for progressive loading
const AUDIO_PRIORITIES: Record<AudioPriority, string[]> = {
  [AudioPriority.CRITICAL]: [
    "welcome",
    "welcome_association",
    "welcome_learning",
    "welcome_association_thai",
    "welcome_learning_thai",
    "success",
    "tap",
    "wrong",
    "win",
  ],
  [AudioPriority.COMMON]: [
    // Numbers 1-10
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    // Common letters
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    // Basic fruits and vegetables
    "apple",
    "banana",
    "orange",
    "grape",
    "strawberry",
    "carrot",
    "broccoli",
    "tomato",
    "potato",
    "onion",
  ],
  [AudioPriority.RARE]: [
    // Weather
    "sunny",
    "cloudy",
    "rainy",
    "snowy",
    "windy",
    // Vehicles
    "car",
    "bus",
    "truck",
    "bicycle",
    "airplane",
    "boat",
    // Animals
    "dog",
    "cat",
    "bird",
    "fish",
    "cow",
    "pig",
    "sheep",
    // Colors
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "black",
    "white",
    // Shapes
    "circle",
    "square",
    "triangle",
    "rectangle",
    "diamond",
    "star",
    // Complex words and remaining items
    "angry",
    "arm",
    "brain",
    "butterfly",
    "celebrate",
    "cherry",
    "cucumber",
    "dance",
    "duck",
    "ear",
    "eight",
    "elephant",
    "flower",
    "happy",
    "house",
    "jump",
    "lion",
    "moon",
    "mountain",
    "music",
    "ocean",
    "pizza",
    "rabbit",
    "run",
    "sad",
    "school",
    "sing",
    "sleep",
    "smile",
    "snake",
    "spider",
    "sun",
    "swim",
    "tiger",
    "tree",
    "turtle",
    "umbrella",
    "water",
    "worm",
  ],
};

const NUMBER_WORD_TO_DIGIT: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
};

const DIGIT_TO_WORD = Object.fromEntries(
  Object.entries(NUMBER_WORD_TO_DIGIT).map(([word, value]) => [value, word]),
) as Record<string, string>;

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

type AudioLoaderByFormat = Map<string, () => Promise<string>>;

// Map of normalized keys to per-format loader functions
const audioLoaderIndex = new Map<string, AudioLoaderByFormat>();
// Cache of resolved URLs to avoid re-fetching the module
const resolvedUrlCache = new Map<string, string>();

const SUPPORTED_FORMATS = [
  { ext: "ogg", mime: 'audio/ogg; codecs="opus"' },
  { ext: "ogg", mime: 'audio/ogg; codecs="vorbis"' },
  { ext: "m4a", mime: 'audio/mp4; codecs="mp4a.40.2"' },
  { ext: "aac", mime: "audio/aac" },
  { ext: "mp3", mime: "audio/mpeg" },
  { ext: "wav", mime: "audio/wav" },
  { ext: "flac", mime: "audio/flac" },
];

let preferredFormatOrder: string[] | null = null;

const getPreferredFormatOrder = (): string[] => {
  if (preferredFormatOrder) return preferredFormatOrder;

  if (typeof Audio === "undefined" || typeof document === "undefined") {
    preferredFormatOrder = ["ogg", "m4a", "aac", "mp3", "wav", "flac"];
    return preferredFormatOrder;
  }

  const testAudio = document.createElement("audio");
  const supported = new Set<string>();

  for (const format of SUPPORTED_FORMATS) {
    const result = testAudio.canPlayType(format.mime);
    if (result === "probably" || result === "maybe") {
      supported.add(format.ext);
    }
  }

  preferredFormatOrder = ["ogg", "m4a", "aac", "mp3", "wav", "flac"].filter(
    (ext) => supported.has(ext),
  );

  if (preferredFormatOrder.length === 0) {
    preferredFormatOrder = ["mp3", "wav"];
  }

  return preferredFormatOrder;
};

const registerAudioAlias = (
  key: string,
  extension: string,
  loader: () => Promise<string>,
) => {
  if (!key) return;
  const entry =
    audioLoaderIndex.get(key) ?? new Map<string, () => Promise<string>>();
  if (!entry.has(extension)) {
    entry.set(extension, loader);
  }
  audioLoaderIndex.set(key, entry);
};

for (const [path, loader] of Object.entries(rawAudioFiles)) {
  const fileNameWithExt = path.split("/").pop() ?? "";
  const match = fileNameWithExt.match(/\.(wav|mp3|ogg|m4a|aac|flac)$/i);
  const extension = match?.[1]?.toLowerCase();
  const fileName = fileNameWithExt.replace(
    /\.(wav|mp3|ogg|m4a|aac|flac)$/i,
    "",
  );
  const normalized = normalizeKey(fileName);

  if (!extension) continue;

  // Register the exact filename (normalized)
  registerAudioAlias(normalized, extension, loader);

  // Handle emoji_ prefix: register both with and without prefix, plus space variant
  if (fileName.startsWith("emoji_")) {
    const withoutPrefix = fileName.slice(6); // "emoji_apple" → "apple"
    registerAudioAlias(normalizeKey(withoutPrefix), extension, loader);
    // Also register space variant: "emoji_ice cream" → "ice cream"
    registerAudioAlias(
      normalizeKey(withoutPrefix.replace(/_/g, " ")),
      extension,
      loader,
    );
  }

  // Number word/digit conversions
  if (DIGIT_TO_WORD[fileName]) {
    registerAudioAlias(
      normalizeKey(DIGIT_TO_WORD[fileName]),
      extension,
      loader,
    );
  }

  if (NUMBER_WORD_TO_DIGIT[fileName]) {
    registerAudioAlias(
      normalizeKey(NUMBER_WORD_TO_DIGIT[fileName]),
      extension,
      loader,
    );
  }

  // Register underscore-to-space variant for multi-word files
  // "fire_truck" → "fire truck", but DON'T split into individual words
  if (fileName.includes("_") && !fileName.startsWith("emoji_")) {
    registerAudioAlias(
      normalizeKey(fileName.replace(/_/g, " ")),
      extension,
      loader,
    );
  }
}

// Debug: Log registered audio files (helpful for Vercel debugging)
if (import.meta.env.DEV) {
  console.log(
    `[SoundManager] Registered ${audioLoaderIndex.size} audio aliases from ${
      Object.keys(rawAudioFiles).length
    } files`,
  );
  console.log(
    "[SoundManager] Sample Keys:",
    Array.from(audioLoaderIndex.keys()).slice(0, 5),
  );
}

// TODO: Refactor this class into smaller modules (see TODO.md Phase 1)
// - Extract audio loading logic → audio-loader.ts
// - Extract playback logic → audio-player.ts
// - Extract speech synthesis → speech-synthesizer.ts
// Current size: 953 lines (down from 959 after voiceWordOnly removal) - Target: <300 lines per module
class SoundManager {
  private audioContext: AudioContext | null = null;
  private bufferCache: LRUCache<string, AudioBuffer> = new LRUCache(50); // Max 50 audio buffers to prevent memory leaks
  private loadingCache: Map<string, Promise<AudioBuffer | null>> = new Map();
  private fallbackEffects: Map<string, AudioBuffer> = new Map();
  private htmlAudioCache: Map<string, string> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map(); // Track active audio sources
  private activeHtmlAudio: Map<string, HTMLAudioElement> = new Map(); // Track active HTML audio elements
  private candidatesCache: Map<string, string[]> = new Map(); // Cache for resolveCandidates results
  private isEnabled = true;
  private volume = 0.6;
  private speechAvailable: boolean | null = null;
  private initAttempted = false; // Track if we've tried to initialize
  private userInteractionReceived = false;
  private isMobile = false;
  private preferHTMLAudio = false;
  private loadedPriorities = new Set<AudioPriority>(); // Track which priority levels have been loaded
  private preloadInProgress = false; // Prevent concurrent preloading
  private currentLanguage: SupportedLanguage = "en"; // Track current language
  private voiceQueue: Promise<void> = Promise.resolve();
  private voiceQueueToken = 0;
  private preloadConcurrency = 4;
  private useAudioSprite = false;
  private activePlaybackCount = 0;
  private peakPlaybackCount = 0;

  constructor() {
    this.detectMobile();

    // Optional audio sprite feature-flag
    this.useAudioSprite = import.meta.env.VITE_AUDIO_SPRITE_ENABLED === "1";
    if (this.useAudioSprite) {
      const spriteUrl =
        import.meta.env.VITE_AUDIO_SPRITE_URL || "/audio-sprites/sprite.mp3";
      const manifestUrl =
        import.meta.env.VITE_AUDIO_SPRITE_MANIFEST_URL ||
        "/audio-sprites/sprite.json";
      audioSpritePlayer.configure({ spriteUrl, manifestUrl });
    }

    void this.initializeAudioContext();
    this.setupUserInteractionListener();
    // Start loading critical audio immediately (welcome screen, essential UI sounds)
    void this.preloadAudioByPriority(AudioPriority.CRITICAL);
  }

  private detectMobile() {
    // Detect if we're on a mobile device
    const ua = navigator.userAgent.toLowerCase();
    this.isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

    // ALWAYS use Web Audio API for better quality and correct playback speed
    // HTMLAudio can cause pitch/speed issues (sounds like frogs/chipmunks)
    this.preferHTMLAudio = false;

    if (this.isMobile && import.meta.env.DEV) {
      console.log(
        "[SoundManager] Mobile device detected - using Web Audio API for correct playback",
      );
    }
  }

  private setupUserInteractionListener() {
    // Set up one-time listeners for user interaction to unlock audio
    const handleInteraction = async () => {
      if (this.userInteractionReceived) return;
      this.userInteractionReceived = true;

      if (import.meta.env.DEV) {
        console.log(
          "[SoundManager] User interaction detected, initializing audio...",
        );
      }
      await this.ensureInitialized();

      // Start progressive loading after audio context is ready
      void this.startProgressiveLoading();

      // Remove listeners after first interaction
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
  }

  private trackPlaybackStart(soundName: string) {
    this.activePlaybackCount += 1;
    this.peakPlaybackCount = Math.max(
      this.peakPlaybackCount,
      this.activePlaybackCount,
    );

    if (typeof window !== "undefined") {
      window.__audioDebug = {
        active: this.activePlaybackCount,
        peak: this.peakPlaybackCount,
        lastSound: soundName,
      };
    }
  }

  private trackPlaybackEnd(soundName?: string) {
    this.activePlaybackCount = Math.max(0, this.activePlaybackCount - 1);

    if (typeof window !== "undefined") {
      window.__audioDebug = {
        active: this.activePlaybackCount,
        peak: this.peakPlaybackCount,
        lastSound: soundName ?? window.__audioDebug?.lastSound,
      };
    }
  }

  private async initializeAudioContext() {
    if (this.audioContext || this.initAttempted) return;
    this.initAttempted = true;

    try {
      const ContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new ContextClass();
      if (import.meta.env.DEV) {
        console.log(
          "[SoundManager] Audio context created, state:",
          this.audioContext.state,
        );
      }
      this.prepareFallbackEffects();

      // Share AudioContext with optional sprite player
      try {
        audioSpritePlayer.setAudioContext(this.audioContext);
      } catch {
        // ignore
      }
    } catch (error) {
      console.error(
        "[SoundManager] Audio context initialization failed:",
        error,
      );
      this.isEnabled = false;
    }
  }

  private prepareFallbackEffects() {
    if (!this.audioContext) return;

    this.fallbackEffects.set(
      "success",
      this.createToneSequence([
        { frequency: 523.25, duration: 0.15 },
        { frequency: 659.25, duration: 0.15 },
        { frequency: 783.99, duration: 0.3 },
      ]),
    );

    this.fallbackEffects.set("tap", this.createTone(800, 0.1, "square"));

    this.fallbackEffects.set(
      "wrong",
      this.createToneSequence([
        { frequency: 400, duration: 0.15 },
        { frequency: 300, duration: 0.15 },
        { frequency: 200, duration: 0.2 },
      ]),
    );

    this.fallbackEffects.set(
      "win",
      this.createToneSequence([
        { frequency: 523.25, duration: 0.2 },
        { frequency: 659.25, duration: 0.2 },
        { frequency: 783.99, duration: 0.2 },
        { frequency: 1046.5, duration: 0.4 },
      ]),
    );
  }

  private createTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
  ): AudioBuffer {
    if (!this.audioContext) throw new Error("Audio context not available");

    const sampleRate = this.audioContext.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
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

      const envelope = Math.min(time * 10, 1, (duration - time) * 10);
      channelData[i] = sample * envelope * 0.3;
    }

    return buffer;
  }

  private createToneSequence(
    notes: { frequency: number; duration: number }[],
  ): AudioBuffer {
    if (!this.audioContext) throw new Error("Audio context not available");

    const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * totalDuration));
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
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

  private resolveCandidates(name: string): string[] {
    // Check cache first for performance
    const cached = this.candidatesCache.get(name);
    if (cached) return cached;

    const normalized = normalizeKey(name);
    const candidates = new Set<string>();

    if (normalized) {
      candidates.add(normalized);

      if (normalized.includes("_")) {
        candidates.add(normalized.replace(/_/g, ""));
      }
    }

    if (NUMBER_WORD_TO_DIGIT[normalized]) {
      candidates.add(normalizeKey(NUMBER_WORD_TO_DIGIT[normalized]));
    }

    if (DIGIT_TO_WORD[normalized]) {
      candidates.add(normalizeKey(DIGIT_TO_WORD[normalized]));
    }

    if (normalized.length === 1) {
      candidates.add(normalized);
    }

    const result = Array.from(candidates);
    this.candidatesCache.set(name, result);
    return result;
  }

  private async getUrl(key: string): Promise<string | null> {
    // Check cache first
    if (resolvedUrlCache.has(key)) {
      return resolvedUrlCache.get(key)!;
    }

    // Get loader
    const loaderEntry = audioLoaderIndex.get(key);
    if (!loaderEntry) return null;

    const preferredFormats = getPreferredFormatOrder();
    let loader: (() => Promise<string>) | undefined;

    for (const ext of preferredFormats) {
      const candidate = loaderEntry.get(ext);
      if (candidate) {
        loader = candidate;
        break;
      }
    }

    if (!loader) {
      const fallback = loaderEntry.values().next().value as
        | (() => Promise<string>)
        | undefined;
      loader = fallback;
    }

    if (!loader) return null;

    try {
      // Load module and get default export (URL)
      const url = await loader();
      resolvedUrlCache.set(key, url);
      return url;
    } catch (error) {
      console.error(
        `[SoundManager] Failed to resolve URL for "${key}":`,
        error,
      );
      return null;
    }
  }

  private async loadFromIndex(key: string): Promise<AudioBuffer | null> {
    if (!this.audioContext || !key) return null;

    const cached = this.bufferCache.get(key);
    if (cached) return cached;

    const pending = this.loadingCache.get(key);
    if (pending) return pending;

    const url = await this.getUrl(key);
    if (!url) {
      console.warn(`[SoundManager] No URL found for key: "${key}"`);
      return null;
    }

    const loadPromise = (async () => {
      try {
        if (import.meta.env.DEV) {
          console.log(`[SoundManager] Loading audio: "${key}" from ${url}`);
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer =
          await this.audioContext!.decodeAudioData(arrayBuffer);
        this.bufferCache.set(key, audioBuffer);
        this.loadingCache.delete(key);
        if (import.meta.env.DEV) {
          console.log(`[SoundManager] Successfully loaded: "${key}"`);
        }
        return audioBuffer;
      } catch (error) {
        console.error(
          `[SoundManager] Failed to load audio "${key}" from ${url}:`,
          error,
        );
        this.loadingCache.delete(key);
        return null;
      }
    })();

    this.loadingCache.set(key, loadPromise);
    return loadPromise;
  }

  private async loadBufferForName(
    name: string,
    allowFallback = true,
  ): Promise<AudioBuffer | null> {
    const candidates = this.resolveCandidates(name);

    for (const candidate of candidates) {
      const buffer = await this.loadFromIndex(candidate);
      if (buffer) return buffer;
    }

    if (allowFallback) {
      const fallback =
        this.fallbackEffects.get(name) || this.fallbackEffects.get("success");
      if (fallback) {
        return fallback;
      }
    }

    return null;
  }

  private async playWithHtmlAudio(
    key: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number,
  ): Promise<boolean> {
    const url = await this.getUrl(key);
    if (!url) return false;

    // Stop any previous instance of this sound
    if (this.activeHtmlAudio.has(key)) {
      try {
        const prevAudio = this.activeHtmlAudio.get(key)!;
        prevAudio.pause();
        prevAudio.currentTime = 0;
        this.activeHtmlAudio.delete(key);
      } catch {
        // Ignore errors from stopping already-stopped audio
      }
    }

    if (!this.htmlAudioCache.has(key)) {
      this.htmlAudioCache.set(key, url);
    }

    return await new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.volume = volumeOverride ?? this.volume;
      audio.playbackRate = playbackRate; // Use provided playback rate (default 1.0 for natural quality)

      // Track this audio element
      this.activeHtmlAudio.set(key, audio);

      let maxDurationTimer: number | undefined;

      const cleanup = () => {
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        if (maxDurationTimer !== undefined) {
          window.clearTimeout(maxDurationTimer);
        }
        this.activeHtmlAudio.delete(key);
      };

      const forceStop = () => {
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
        cleanup();
        if (import.meta.env.DEV) {
          console.log(
            `[SoundManager] Force-stopped "${key}" after ${maxDuration}ms`,
          );
        }
        resolve(true);
      };

      const handleEnded = () => {
        cleanup();
        eventTracker.trackAudioPlayback({
          audioKey: key,
          targetName: key,
          method: "html-audio",
          success: true,
          duration: audio.duration,
        });
        resolve(true);
      };

      const handleError = (event: Event) => {
        console.warn(`HTMLAudio playback failed for "${key}"`, event);
        cleanup();
        eventTracker.trackAudioPlayback({
          audioKey: key,
          targetName: key,
          method: "html-audio",
          success: false,
          error: "playback_error",
        });
        resolve(false);
      };

      audio.addEventListener("ended", handleEnded, { once: true });
      audio.addEventListener("error", handleError, { once: true });

      // Set up max duration timer if specified
      if (maxDuration !== undefined && maxDuration > 0) {
        maxDurationTimer = window.setTimeout(forceStop, maxDuration);
      }

      audio.play().catch((error) => {
        console.warn(`Unable to start audio element for "${key}":`, error);
        cleanup();
        eventTracker.trackAudioPlayback({
          audioKey: key,
          targetName: key,
          method: "html-audio",
          success: false,
          error: error.message || "play_error",
        });
        resolve(false);
      });
    });
  }

  private async playVoiceClip(
    name: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number,
  ): Promise<boolean> {
    const candidates = this.resolveCandidates(name);

    for (const candidate of candidates) {
      const played = await this.playWithHtmlAudio(
        candidate,
        playbackRate,
        maxDuration,
        volumeOverride,
      );
      if (played) {
        return true;
      }
    }

    return false;
  }

  private canUseSpeech(): boolean {
    if (this.speechAvailable !== null) {
      return this.speechAvailable;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.speechAvailable = false;
      console.warn(
        "[SoundManager] Speech synthesis not available in this environment",
      );
      return false;
    }

    this.speechAvailable = true;
    if (import.meta.env.DEV) {
      console.log("[SoundManager] Speech synthesis is available");
    }
    return true;
  }

  private speakWithSpeechSynthesis(
    text: string,
    volumeOverride?: number,
    cancelPrevious = false,
  ): boolean {
    if (import.meta.env.DEV) {
      console.log(`[SoundManager] Attempting speech synthesis for: "${text}"`);
    }

    if (!this.canUseSpeech()) {
      console.warn("[SoundManager] Cannot use speech - not available");
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: "not_available",
      });
      return false;
    }

    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        console.warn("[SoundManager] speechSynthesis object not found");
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: false,
          error: "synth_not_found",
        });
        return false;
      }

      // Cancel any ongoing speech if requested (for target announcements)
      if (cancelPrevious && synth.speaking) {
        synth.cancel();
        if (import.meta.env.DEV) {
          console.log("[SoundManager] Cancelled previous speech synthesis");
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0; // Natural speed for better quality (was 0.8)
      utterance.pitch = 1.0; // Natural pitch for better voice quality
      utterance.volume = volumeOverride ?? this.volume;

      // Add event listeners for debugging
      utterance.onstart = () => {
        if (import.meta.env.DEV) {
          console.log(`[SoundManager] Started speaking: "${text}"`);
        }
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: true,
        });
      };

      utterance.onend = () => {
        if (import.meta.env.DEV) {
          console.log(`[SoundManager] Finished speaking: "${text}"`);
        }
      };

      utterance.onerror = (event) => {
        console.error("[SoundManager] Speech synthesis error:", event);
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: false,
          error: event.error || "unknown_error",
        });
      };

      synth.speak(utterance);

      if (import.meta.env.DEV) {
        console.log("[SoundManager] Speech synthesis initiated successfully");
      }
      return true;
    } catch (error) {
      console.warn("[SoundManager] Speech synthesis failed:", error);
      this.speechAvailable = false;
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: error instanceof Error ? error.message : "exception",
      });
      return false;
    }
  }

  private async speakWithSpeechSynthesisAsync(
    text: string,
    volumeOverride?: number,
    cancelPrevious = false,
  ): Promise<boolean> {
    if (import.meta.env.DEV) {
      console.log(`[SoundManager] Attempting speech synthesis for: "${text}"`);
    }

    if (!this.canUseSpeech()) {
      console.warn("[SoundManager] Cannot use speech - not available");
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: "not_available",
      });
      return false;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("[SoundManager] speechSynthesis object not found");
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: "synth_not_found",
      });
      return false;
    }

    if (cancelPrevious && synth.speaking) {
      synth.cancel();
      if (import.meta.env.DEV) {
        console.log("[SoundManager] Cancelled previous speech synthesis");
      }
    }

    return new Promise<boolean>((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = volumeOverride ?? this.volume;

        utterance.onstart = () => {
          if (import.meta.env.DEV) {
            console.log(`[SoundManager] Started speaking: "${text}"`);
          }
          eventTracker.trackAudioPlayback({
            audioKey: text,
            targetName: text,
            method: "speech-synthesis",
            success: true,
          });
        };

        utterance.onend = () => {
          if (import.meta.env.DEV) {
            console.log(`[SoundManager] Finished speaking: "${text}"`);
          }
          resolve(true);
        };

        utterance.onerror = (event) => {
          console.error("[SoundManager] Speech synthesis error:", event);
          eventTracker.trackAudioPlayback({
            audioKey: text,
            targetName: text,
            method: "speech-synthesis",
            success: false,
            error: event.error || "unknown_error",
          });
          resolve(false);
        };

        synth.speak(utterance);

        if (import.meta.env.DEV) {
          console.log("[SoundManager] Speech synthesis initiated successfully");
        }
      } catch (error) {
        console.warn("[SoundManager] Speech synthesis failed:", error);
        this.speechAvailable = false;
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: false,
          error: error instanceof Error ? error.message : "exception",
        });
        resolve(false);
      }
    });
  }

  private async resumeIfSuspended() {
    if (!this.audioContext) {
      console.warn("[SoundManager] Cannot resume: no audio context");
      return;
    }

    if (this.audioContext.state === "suspended") {
      try {
        if (import.meta.env.DEV) {
          console.log("[SoundManager] Resuming suspended audio context...");
        }
        await this.audioContext.resume();
        if (import.meta.env.DEV) {
          console.log(
            "[SoundManager] Audio context resumed, state:",
            this.audioContext.state,
          );
        }
      } catch (error) {
        console.error("[SoundManager] Failed to resume audio context:", error);
      }
    } else if (import.meta.env.DEV) {
      console.log(
        "[SoundManager] Audio context state:",
        this.audioContext.state,
      );
    }
  }

  private resetVoiceQueue(): void {
    this.voiceQueueToken += 1;
    this.voiceQueue = Promise.resolve();
  }

  private enqueueVoicePlayback(task: () => Promise<void>): Promise<void> {
    const token = this.voiceQueueToken;
    const run = async () => {
      if (token !== this.voiceQueueToken) return;
      await task();
    };

    this.voiceQueue = this.voiceQueue.then(run, run);
    return this.voiceQueue;
  }

  private async runWithConcurrency<T>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<void>,
  ): Promise<void> {
    if (items.length === 0) return;

    const queue = [...items];
    const workers = Array.from(
      { length: Math.min(limit, queue.length) },
      async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;
          await worker(next);
        }
      },
    );

    await Promise.allSettled(workers);
  }

  private startBuffer(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ) {
    if (!this.audioContext) return;

    // Stop any previous instance of this sound
    if (soundKey && this.activeSources.has(soundKey)) {
      try {
        const prevSource = this.activeSources.get(soundKey)!;
        prevSource.stop();
        this.activeSources.delete(soundKey);
      } catch {
        // Ignore errors from stopping already-stopped sources
      }
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = playbackRate; // Use provided playback rate (default 1.0 for natural quality)
    gainNode.gain.value = volumeOverride ?? this.volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const startTime = this.audioContext.currentTime + Math.max(0, delaySeconds);
    source.start(startTime);

    // Track this source and auto-cleanup when it ends
    if (soundKey) {
      this.activeSources.set(soundKey, source);
    }
  }

  /**
   * Start audio buffer playback and return a promise that resolves when playback ends
   * @returns Promise that resolves when audio finishes playing
   */
  private startBufferAsync(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      // Stop any previous instance of this sound
      if (soundKey && this.activeSources.has(soundKey)) {
        try {
          const prevSource = this.activeSources.get(soundKey)!;
          prevSource.stop();
          this.activeSources.delete(soundKey);
        } catch {
          // Ignore errors from stopping already-stopped sources
        }
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gainNode.gain.value = volumeOverride ?? this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const startTime =
        this.audioContext.currentTime + Math.max(0, delaySeconds);
      source.start(startTime);

      // Track this source and resolve when it ends
      if (soundKey) {
        this.activeSources.set(soundKey, source);
      }

      source.onended = () => {
        if (soundKey) {
          this.activeSources.delete(soundKey);
        }
        resolve();
      };
    });
  }

  async ensureInitialized() {
    if (!this.isEnabled) {
      console.warn("[SoundManager] Audio is disabled");
      return;
    }

    if (!this.audioContext) {
      console.log("[SoundManager] Initializing audio context...");
      await this.initializeAudioContext();
    }

    await this.resumeIfSuspended();
  }

  /**
   * Preload audio files by priority level for progressive loading
   * @param priority - Priority level to preload (CRITICAL, COMMON, RARE)
   * @returns Promise that resolves when preloading is complete
   */
  async preloadAudioByPriority(priority: AudioPriority): Promise<void> {
    if (this.preloadInProgress || this.loadedPriorities.has(priority)) {
      return;
    }

    // Ensure AudioContext is ready before attempting to decode audio buffers
    await this.ensureInitialized();
    if (!this.audioContext) {
      if (import.meta.env.DEV) {
        console.warn(
          `[SoundManager] Cannot preload ${AudioPriority[priority]} - AudioContext not available`,
        );
      }
      return;
    }

    this.preloadInProgress = true;

    try {
      if (import.meta.env.DEV) {
        console.log(
          `[SoundManager] Preloading ${AudioPriority[priority]} priority audio...`,
        );
      }

      const audioFiles = AUDIO_PRIORITIES[priority];
      const toLoad = audioFiles.filter(
        (audioKey) =>
          !this.bufferCache.has(audioKey) && !this.loadingCache.has(audioKey),
      );

      await this.runWithConcurrency(
        toLoad,
        this.preloadConcurrency,
        async (audioKey) => {
          try {
            await this.loadFromIndex(audioKey);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn(
                `[SoundManager] Failed to preload "${audioKey}":`,
                error,
              );
            }
          }
        },
      );

      this.loadedPriorities.add(priority);

      if (import.meta.env.DEV) {
        console.log(
          `[SoundManager] Completed preloading ${AudioPriority[priority]} priority audio (${audioFiles.length} files)`,
        );
      }
    } catch (error) {
      console.error(
        `[SoundManager] Error during ${AudioPriority[priority]} priority preloading:`,
        error,
      );
    } finally {
      this.preloadInProgress = false;
    }
  }

  /**
   * Start progressive audio loading sequence
   * Loads CRITICAL first, then COMMON, then RARE audio files
   */
  async startProgressiveLoading(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Phase 1: Load critical audio (welcome screen, essential UI)
      await this.preloadAudioByPriority(AudioPriority.CRITICAL);

      // Phase 2: Load common audio (numbers, letters, basic words) after user interaction
      if (this.userInteractionReceived) {
        await this.preloadAudioByPriority(AudioPriority.COMMON);
      }

      // Phase 3: Load rare audio (weather, vehicles, complex words) on demand
      // This will be triggered when specific content is accessed
    } catch (error) {
      console.error("[SoundManager] Error during progressive loading:", error);
    }
  }

  /**
   * Stop all currently playing audio sources
   * Useful for preventing overlapping when target changes
   */
  stopAllAudio() {
    // Stop all Web Audio API sources
    for (const [key, source] of this.activeSources.entries()) {
      try {
        source.stop();
        this.activeSources.delete(key);
      } catch {
        // Source may have already stopped
      }
    }

    // Stop all HTMLAudio elements
    for (const [key, audio] of this.activeHtmlAudio.entries()) {
      try {
        audio.pause();
        audio.currentTime = 0;
        this.activeHtmlAudio.delete(key);
      } catch {
        // Audio may have already stopped
      }
    }

    // Cancel speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Speech synthesis may not be available
      }
    }

    if (import.meta.env.DEV) {
      console.log("[SoundManager] Stopped all active audio");
    }

    this.activePlaybackCount = 0;
    if (typeof window !== "undefined") {
      window.__audioDebug = {
        active: 0,
        peak: this.peakPlaybackCount,
        lastSound: window.__audioDebug?.lastSound,
      };
    }
  }

  /**
   * Play a sound effect and wait for it to complete
   * @param soundName - Name of the sound to play
   * @param playbackRate - Playback speed (default 0.9 for slightly slower)
   * @returns Promise that resolves when audio finishes playing
   */
  async playSound(
    soundName: string,
    playbackRate = 0.9,
    volumeOverride?: number,
  ): Promise<void> {
    if (!this.isEnabled) return;

    this.trackPlaybackStart(soundName);

    try {
      if (import.meta.env.DEV) {
        console.log(`[SoundManager] playSound called: "${soundName}"`);
      }

      // Audio sprite (optional): try to play from a single bundled file
      if (this.useAudioSprite && audioSpritePlayer.isConfigured()) {
        const candidates = this.resolveCandidates(soundName);
        for (const candidate of candidates) {
          const played = await audioSpritePlayer.playClip(candidate, {
            playbackRate,
            volume: volumeOverride ?? this.volume,
          });
          if (played) {
            return;
          }
        }
      }

      // On Android, prefer HTMLAudio for better compatibility
      if (this.preferHTMLAudio) {
        const candidates = this.resolveCandidates(soundName);
        for (const candidate of candidates) {
          const played = await this.playWithHtmlAudio(
            candidate,
            playbackRate,
            undefined,
            volumeOverride,
          );
          if (played) {
            console.log(`[SoundManager] Played with HTMLAudio: "${soundName}"`);
            return;
          }
        }
        console.warn(
          `[SoundManager] HTMLAudio failed for "${soundName}", falling back to Web Audio`,
        );
      }

      // Fall back to Web Audio API
      await this.ensureInitialized();
      if (!this.audioContext) {
        console.error("[SoundManager] No audio context available");
        return;
      }

      const buffer = await this.loadBufferForName(soundName);
      if (!buffer) {
        console.warn(
          `[SoundManager] Sound "${soundName}" not available, using fallback`,
        );

        // Optional accessibility: announce what would have played
        describeIfEnabled(`Sound: ${soundName}`);
        return;
      }

      // Use startBufferAsync to wait for audio to complete before returning
      await this.startBufferAsync(
        buffer,
        0,
        soundName,
        playbackRate,
        volumeOverride,
      );
      if (import.meta.env.DEV) {
        console.log(`[SoundManager] Finished playing sound: "${soundName}"`);
      }
    } catch (error) {
      console.error("[SoundManager] Failed to play sound:", error);
      describeIfEnabled(`Sound failed: ${soundName}`);
    } finally {
      this.trackPlaybackEnd(soundName);
    }
  }

  // Add debug method to check audio system status
  getDebugInfo() {
    return {
      isEnabled: this.isEnabled,
      hasContext: !!this.audioContext,
      contextState: this.audioContext?.state,
      registeredAliases: audioLoaderIndex.size,
      cachedBuffers: this.bufferCache.size,
      loadedPriorities: Array.from(this.loadedPriorities).map(
        (p) => AudioPriority[p],
      ),
      preloadInProgress: this.preloadInProgress,
      sampleAliases: Array.from(audioLoaderIndex.keys()).slice(0, 5),
    };
  }

  /**
   * Internal method to play word audio with optional sentence template
   * @param phrase - The word/phrase to play
   * @param volumeOverride - Optional volume override
   * @param useSentenceTemplate - Whether to check SENTENCE_TEMPLATES (true for new target, false for tap feedback)
   * @param cancelPrevious - Whether to cancel any ongoing speech synthesis (true for target announcements)
   * @returns Promise that resolves when audio playback is complete or fails
   */
  private async playWordInternal(
    phrase: string,
    volumeOverride?: number,
    useSentenceTemplate = true,
    cancelPrevious = false,
  ) {
    if (!this.isEnabled || !phrase) return;

    try {
      await this.ensureInitialized();

      const trimmed = phrase.trim();
      if (!trimmed) return;

      const startTime = performance.now();
      const normalizedPhrase = trimmed.toLowerCase();

      // PRIORITY 1 (optional): Look up sentence template for educational context
      if (useSentenceTemplate) {
        const sentence = getSentenceTemplate(
          normalizedPhrase,
          this.currentLanguage,
        );

        if (sentence) {
          // We have a sentence template, speak the full sentence FIRST
          if (import.meta.env.DEV) {
            console.log(
              `[SoundManager] Using sentence template for "${trimmed}": "${sentence}"`,
            );
          }
          if (
            await this.speakWithSpeechSynthesisAsync(
              sentence,
              volumeOverride,
              cancelPrevious,
            )
          ) {
            if (import.meta.env.DEV) {
              console.log(
                `[SoundManager] Successfully spoke sentence via speech synthesis`,
              );
            }
            const duration = performance.now() - startTime;
            eventTracker.trackAudioPlayback({
              audioKey: normalizedPhrase,
              targetName: trimmed,
              method: "speech-synthesis",
              success: true,
              duration,
            });
            return;
          } else {
            console.warn(
              `[SoundManager] Speech synthesis failed for sentence, falling back`,
            );
          }
        }
      }

      // Try audio sprite first (optional)
      if (this.useAudioSprite && audioSpritePlayer.isConfigured()) {
        const candidates = this.resolveCandidates(trimmed);
        for (const candidate of candidates) {
          const played = await audioSpritePlayer.playClip(candidate, {
            playbackRate: 1.0,
            volume: volumeOverride ?? this.volume,
          });
          if (played) {
            const duration = performance.now() - startTime;
            eventTracker.trackAudioPlayback({
              audioKey: candidate,
              targetName: trimmed,
              method: "audio-sprite",
              success: true,
              duration,
            });
            return;
          }
        }
      }

      // Try exact phrase as audio file (PRIORITY 2 when using sentence template, PRIORITY 1 when not)
      if (await this.playVoiceClip(trimmed, 1.0, undefined, volumeOverride)) {
        const duration = performance.now() - startTime;
        const candidates = this.resolveCandidates(trimmed);
        const successfulKey =
          candidates.find((c) => audioLoaderIndex.has(c)) || trimmed;
        eventTracker.trackAudioPlayback({
          audioKey: successfulKey,
          targetName: trimmed,
          method: "wav",
          success: true,
          duration,
        });
        return;
      }

      // For multi-word phrases, try speech synthesis (PRIORITY 3 when using sentence template, PRIORITY 2 when not)
      const parts = trimmed.split(/[\s-]+/).filter(Boolean);
      if (parts.length > 1) {
        if (
          await this.speakWithSpeechSynthesisAsync(
            trimmed,
            volumeOverride,
            cancelPrevious,
          )
        ) {
          const duration = performance.now() - startTime;
          eventTracker.trackAudioPlayback({
            audioKey: trimmed,
            targetName: trimmed,
            method: "speech-synthesis",
            success: true,
            duration,
          });
          return;
        }

        // Fourth try: play individual words with delays
        let delay = 0;
        let anyPlayed = false;
        for (const part of parts) {
          const buffer = await this.loadBufferForName(part, false);
          if (buffer && this.audioContext) {
            this.startBuffer(buffer, delay, undefined, 1.0, volumeOverride);
            delay += buffer.duration + 0.1; // 100ms gap between words
            anyPlayed = true;
          }
        }

        if (anyPlayed) {
          const duration = performance.now() - startTime;
          eventTracker.trackAudioPlayback({
            audioKey: trimmed,
            targetName: trimmed,
            method: "wav",
            success: true,
            duration,
          });
          return;
        }
      } else {
        // Single word: try speech synthesis
        if (
          await this.speakWithSpeechSynthesisAsync(
            trimmed,
            volumeOverride,
            cancelPrevious,
          )
        ) {
          const duration = performance.now() - startTime;
          eventTracker.trackAudioPlayback({
            audioKey: trimmed,
            targetName: trimmed,
            method: "speech-synthesis",
            success: true,
            duration,
          });
          return;
        }
      }

      // No audio played successfully
      describeIfEnabled(`Target: ${trimmed}`);
      eventTracker.trackAudioPlayback({
        audioKey: trimmed,
        targetName: trimmed,
        method: "fallback-tone",
        success: false,
        error: "no_audio_available",
      });
    } catch (error) {
      const errorMsg = useSentenceTemplate
        ? "Failed to play word audio"
        : "Failed to play word-only audio";
      console.warn(`${errorMsg}:`, error);
      eventTracker.trackAudioPlayback({
        audioKey: phrase,
        targetName: phrase,
        method: "fallback-tone",
        success: false,
        error: error instanceof Error ? error.message : "exception",
      });
    }
  }

  async playWord(phrase: string, volumeOverride?: number) {
    // For target announcements, stop all active audio to avoid overlapping
    // This includes HTMLAudio from tap feedback and speech synthesis from previous announcements
    this.stopAllAudio();
    this.resetVoiceQueue();
    return this.enqueueVoicePlayback(() =>
      this.playWordInternal(phrase, volumeOverride, true, true),
    );
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  // Public method for custom speech synthesis with options
  async playSpeech(
    text: string,
    options?: { pitch?: number; rate?: number; volume?: number },
  ) {
    if (!this.isEnabled || !text) return;

    return this.enqueueVoicePlayback(async () => {
      try {
        if (!this.canUseSpeech()) {
          console.warn("[SoundManager] Speech synthesis not available");
          return;
        }

        const synth = window.speechSynthesis;
        if (!synth) return;

        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.pitch = options?.pitch ?? 1.0;
          utterance.rate = options?.rate ?? 1.0;
          utterance.volume = options?.volume ?? this.volume;

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();

          synth.speak(utterance);
        });

        if (import.meta.env.DEV) {
          console.log(
            `[SoundManager] Speaking with custom options: "${text}"`,
            options,
          );
        }
      } catch (error) {
        console.error("[SoundManager] Custom speech synthesis error:", error);
      }
    });
  }

  /**
   * Set current language for audio playback and speech synthesis
   * @param langCode - Language code (e.g., 'en', 'fr', 'ja', 'th', 'zh-CN', 'zh-HK')
   */
  setLanguage(langCode: SupportedLanguage): void {
    if (this.currentLanguage === langCode) return;

    this.currentLanguage = langCode;

    // Update speech synthesizer language
    try {
      speechSynthesizer.setLanguage(langCode);
    } catch (error) {
      console.warn(
        "[SoundManager] Failed to set speech synthesizer language:",
        error,
      );
    }

    // Clear relevant caches to force reload with new language if needed
    // Keep buffer cache as it's language-agnostic
    this.candidatesCache.clear();

    if (import.meta.env.DEV) {
      console.log(`[SoundManager] Language changed to: ${langCode}`);
    }
  }

  /**
   * Get current language setting
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get voice ID for current language from ElevenLabs config
   */
  getLanguageVoiceId(): string {
    const config = getLanguageConfig(this.currentLanguage);
    return config.elevenLabsVoiceId;
  }

  /**
   * Prefetch (download + decode) a list of audio keys in the background.
   * Intended for "Level 2 during Level 1" style progressive loading.
   */
  async prefetchAudioKeys(keys: string[]): Promise<void> {
    if (!this.isEnabled || keys.length === 0) return;

    if (typeof window === "undefined") return;

    // Ensure context is available (we want decodeAudioData, not just URL resolution)
    await this.ensureInitialized();
    if (!this.audioContext) return;

    const unique = Array.from(
      new Set(keys.map((k) => k.trim()).filter(Boolean)),
    );

    const work = async () => {
      // Preload sprite in background if enabled
      if (this.useAudioSprite && audioSpritePlayer.isConfigured()) {
        await audioSpritePlayer.prefetch();
      }

      const candidatesToLoad: string[] = [];

      for (const key of unique) {
        const candidates = this.resolveCandidates(key);
        for (const candidate of candidates) {
          if (
            this.bufferCache.has(candidate) ||
            this.loadingCache.has(candidate)
          ) {
            continue;
          }

          if (!audioLoaderIndex.has(candidate)) {
            continue;
          }

          candidatesToLoad.push(candidate);
          break;
        }
      }

      await this.runWithConcurrency(
        candidatesToLoad,
        this.preloadConcurrency,
        async (candidate) => {
          try {
            await this.loadFromIndex(candidate);
          } catch {
            // Ignore failures during background prefetch
          }
        },
      );
    };

    // Schedule during idle time when possible
    if ("requestIdleCallback" in window) {
      (
        window as unknown as {
          requestIdleCallback: (
            cb: () => void,
            opts?: { timeout: number },
          ) => void;
        }
      ).requestIdleCallback(
        () => {
          void work();
        },
        { timeout: 1500 },
      );
    } else {
      setTimeout(() => {
        void work();
      }, 250);
    }
  }
}

export const soundManager = new SoundManager();

export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    // Play excited "GIVE THEM A STICKER!" voice using speech synthesis
    soundManager.playSpeech("GIVE THEM A STICKER!", { pitch: 1.2, rate: 1.1 });
  },
  welcome: async () => {
    // Play welcome audio file - 5 second happy monophonic tune
    return soundManager.playSound("welcome");
  },
  stopAll: () => soundManager.stopAllAudio(),
  // Single-word pronunciation removed - only full sentence announcements and celebration allowed
};

// Hook-friendly prefetch helper (does not change playSoundEffect surface)
export const prefetchAudioKeys = (keys: string[]) =>
  soundManager.prefetchAudioKeys(keys);

// Export debug function for troubleshooting
export const getAudioDebugInfo = () => soundManager.getDebugInfo();
