// Sound Manager - Enhanced audio system that supports wav assets and speech-like cues

const rawAudioFiles = import.meta.glob('../../sounds/*.wav', {
    eager: true,
    import: 'default',
    query: '?url'
}) as Record<string, string>

const NUMBER_WORD_TO_DIGIT: Record<string, string> = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10'
}

const DIGIT_TO_WORD = Object.fromEntries(
    Object.entries(NUMBER_WORD_TO_DIGIT).map(([word, value]) => [value, word])
) as Record<string, string>

const normalizeKey = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')

const audioUrlIndex = new Map<string, string>()

const registerAudioAlias = (key: string, url: string) => {
    if (!key) return
    if (!audioUrlIndex.has(key)) {
        audioUrlIndex.set(key, url)
    }
}

for (const [path, url] of Object.entries(rawAudioFiles)) {
    const fileNameWithExt = path.split('/').pop() ?? ''
    const fileName = fileNameWithExt.replace(/\.wav$/i, '')
    const normalized = normalizeKey(fileName)

    // Register the exact filename (normalized)
    registerAudioAlias(normalized, url)

    // Handle emoji_ prefix: register both with and without prefix, plus space variant
    if (fileName.startsWith('emoji_')) {
        const withoutPrefix = fileName.slice(6) // "emoji_apple" → "apple"
        registerAudioAlias(normalizeKey(withoutPrefix), url)
        // Also register space variant: "emoji_ice cream" → "ice cream"
        registerAudioAlias(normalizeKey(withoutPrefix.replace(/_/g, ' ')), url)
    }

    // Number word/digit conversions
    if (DIGIT_TO_WORD[fileName]) {
        registerAudioAlias(normalizeKey(DIGIT_TO_WORD[fileName]), url)
    }

    if (NUMBER_WORD_TO_DIGIT[fileName]) {
        registerAudioAlias(normalizeKey(NUMBER_WORD_TO_DIGIT[fileName]), url)
    }

    // Register underscore-to-space variant for multi-word files
    // "fire_truck" → "fire truck", but DON'T split into individual words
    if (fileName.includes('_') && !fileName.startsWith('emoji_')) {
        registerAudioAlias(normalizeKey(fileName.replace(/_/g, ' ')), url)
    }
}

// Debug: Log registered audio files (helpful for Vercel debugging)
if (import.meta.env.DEV) {
    console.log(`[SoundManager] Registered ${audioUrlIndex.size} audio aliases from ${Object.keys(rawAudioFiles).length} files`)
    console.log('[SoundManager] Sample URLs:', Array.from(audioUrlIndex.entries()).slice(0, 5))
}

class SoundManager {
    private audioContext: AudioContext | null = null
    private bufferCache: Map<string, AudioBuffer> = new Map()
    private loadingCache: Map<string, Promise<AudioBuffer | null>> = new Map()
    private fallbackEffects: Map<string, AudioBuffer> = new Map()
    private htmlAudioCache: Map<string, string> = new Map()
    private isEnabled = true
    private volume = 0.6
    private speechAvailable: boolean | null = null
    private initAttempted = false // Track if we've tried to initialize
    private userInteractionReceived = false

    constructor() {
        void this.initializeAudioContext()
        this.setupUserInteractionListener()
    }

    private setupUserInteractionListener() {
        // Set up one-time listeners for user interaction to unlock audio
        const handleInteraction = async () => {
            if (this.userInteractionReceived) return
            this.userInteractionReceived = true

            console.log('[SoundManager] User interaction detected, initializing audio...')
            await this.ensureInitialized()

            // Remove listeners after first interaction
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('touchstart', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
        }

        document.addEventListener('click', handleInteraction, { once: true })
        document.addEventListener('touchstart', handleInteraction, { once: true })
        document.addEventListener('keydown', handleInteraction, { once: true })
    }

    private async initializeAudioContext() {
        if (this.audioContext || this.initAttempted) return
        this.initAttempted = true

        try {
            const ContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            this.audioContext = new ContextClass()
            console.log('[SoundManager] Audio context created, state:', this.audioContext.state)
            this.prepareFallbackEffects()
        } catch (error) {
            console.error('[SoundManager] Audio context initialization failed:', error)
            this.isEnabled = false
        }
    }

    private prepareFallbackEffects() {
        if (!this.audioContext) return

        this.fallbackEffects.set('success', this.createToneSequence([
            { frequency: 523.25, duration: 0.15 },
            { frequency: 659.25, duration: 0.15 },
            { frequency: 783.99, duration: 0.3 }
        ]))

        this.fallbackEffects.set('tap', this.createTone(800, 0.1, 'square'))

        this.fallbackEffects.set('wrong', this.createToneSequence([
            { frequency: 400, duration: 0.15 },
            { frequency: 300, duration: 0.15 },
            { frequency: 200, duration: 0.2 }
        ]))

        this.fallbackEffects.set('win', this.createToneSequence([
            { frequency: 523.25, duration: 0.2 },
            { frequency: 659.25, duration: 0.2 },
            { frequency: 783.99, duration: 0.2 },
            { frequency: 1046.5, duration: 0.4 }
        ]))
    }

    private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
        if (!this.audioContext) throw new Error('Audio context not available')

        const sampleRate = this.audioContext.sampleRate
        const frameCount = Math.max(1, Math.floor(sampleRate * duration))
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)

        for (let i = 0; i < frameCount; i++) {
            const time = i / sampleRate
            let sample = 0

            switch (type) {
                case 'square':
                    sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1
                    break
                case 'triangle':
                    sample = 2 * Math.abs(2 * (frequency * time - Math.floor(frequency * time + 0.5))) - 1
                    break
                default:
                    sample = Math.sin(2 * Math.PI * frequency * time)
                    break
            }

            const envelope = Math.min(time * 10, 1, (duration - time) * 10)
            channelData[i] = sample * envelope * 0.3
        }

        return buffer
    }

    private createToneSequence(notes: { frequency: number, duration: number }[]): AudioBuffer {
        if (!this.audioContext) throw new Error('Audio context not available')

        const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0)
        const sampleRate = this.audioContext.sampleRate
        const frameCount = Math.max(1, Math.floor(sampleRate * totalDuration))
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)

        let currentFrame = 0
        for (const note of notes) {
            const noteFrames = Math.max(1, Math.floor(sampleRate * note.duration))
            for (let i = 0; i < noteFrames; i++) {
                const time = i / sampleRate
                const sample = Math.sin(2 * Math.PI * note.frequency * time)
                const envelope = Math.min(time * 20, 1, (note.duration - time) * 10)

                if (currentFrame + i < frameCount) {
                    channelData[currentFrame + i] = sample * envelope * 0.2
                }
            }
            currentFrame += noteFrames
        }

        return buffer
    }

    private resolveCandidates(name: string): string[] {
        const normalized = normalizeKey(name)
        const candidates = new Set<string>()

        if (normalized) {
            candidates.add(normalized)

            if (normalized.includes('_')) {
                candidates.add(normalized.replace(/_/g, ''))
            }
        }

        if (NUMBER_WORD_TO_DIGIT[normalized]) {
            candidates.add(normalizeKey(NUMBER_WORD_TO_DIGIT[normalized]))
        }

        if (DIGIT_TO_WORD[normalized]) {
            candidates.add(normalizeKey(DIGIT_TO_WORD[normalized]))
        }

        if (normalized.length === 1) {
            candidates.add(normalized)
        }

        return Array.from(candidates)
    }

    private async loadFromIndex(key: string): Promise<AudioBuffer | null> {
        if (!this.audioContext || !key) return null

        const cached = this.bufferCache.get(key)
        if (cached) return cached

        const pending = this.loadingCache.get(key)
        if (pending) return pending

        const url = audioUrlIndex.get(key)
        if (!url) {
            console.warn(`[SoundManager] No URL found for key: "${key}"`)
            return null
        }

        const loadPromise = (async () => {
            try {
                console.log(`[SoundManager] Loading audio: "${key}" from ${url}`)
                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
                const arrayBuffer = await response.arrayBuffer()
                const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
                this.bufferCache.set(key, audioBuffer)
                this.loadingCache.delete(key)
                console.log(`[SoundManager] Successfully loaded: "${key}"`)
                return audioBuffer
            } catch (error) {
                console.error(`[SoundManager] Failed to load audio "${key}" from ${url}:`, error)
                this.loadingCache.delete(key)
                return null
            }
        })()

        this.loadingCache.set(key, loadPromise)
        return loadPromise
    }

    private async loadBufferForName(name: string, allowFallback = true): Promise<AudioBuffer | null> {
        const candidates = this.resolveCandidates(name)

        for (const candidate of candidates) {
            const buffer = await this.loadFromIndex(candidate)
            if (buffer) return buffer
        }

        if (allowFallback) {
            const fallback = this.fallbackEffects.get(name) || this.fallbackEffects.get('success')
            if (fallback) {
                return fallback
            }
        }

        return null
    }

    private async playWithHtmlAudio(key: string): Promise<boolean> {
        const url = audioUrlIndex.get(key)
        if (!url) return false

        if (!this.htmlAudioCache.has(key)) {
            this.htmlAudioCache.set(key, url)
        }

        return await new Promise<boolean>((resolve) => {
            const audio = new Audio(url)
            audio.preload = 'auto'
            audio.crossOrigin = 'anonymous'
            audio.volume = this.volume

            const cleanup = () => {
                audio.removeEventListener('ended', handleEnded)
                audio.removeEventListener('error', handleError)
            }

            const handleEnded = () => {
                cleanup()
                resolve(true)
            }

            const handleError = (event: Event) => {
                console.warn(`HTMLAudio playback failed for "${key}"`, event)
                cleanup()
                resolve(false)
            }

            audio.addEventListener('ended', handleEnded, { once: true })
            audio.addEventListener('error', handleError, { once: true })

            audio.play().catch(error => {
                console.warn(`Unable to start audio element for "${key}":`, error)
                cleanup()
                resolve(false)
            })
        })
    }

    private async playVoiceClip(name: string): Promise<boolean> {
        const candidates = this.resolveCandidates(name)

        for (const candidate of candidates) {
            const played = await this.playWithHtmlAudio(candidate)
            if (played) {
                return true
            }
        }

        return false
    }

    private canUseSpeech(): boolean {
        if (this.speechAvailable !== null) {
            return this.speechAvailable
        }

        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            this.speechAvailable = false
            return false
        }

        this.speechAvailable = true
        return true
    }

    private speakWithSpeechSynthesis(text: string): boolean {
        if (!this.canUseSpeech()) {
            return false
        }

        try {
            const synth = window.speechSynthesis
            if (!synth) {
                return false
            }

            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 0.95
            utterance.pitch = 1
            utterance.volume = this.volume

            synth.cancel()
            synth.speak(utterance)

            return true
        } catch (error) {
            console.warn('Speech synthesis failed:', error)
            this.speechAvailable = false
            return false
        }
    }

    private async resumeIfSuspended() {
        if (!this.audioContext) {
            console.warn('[SoundManager] Cannot resume: no audio context')
            return
        }

        if (this.audioContext.state === 'suspended') {
            try {
                console.log('[SoundManager] Resuming suspended audio context...')
                await this.audioContext.resume()
                console.log('[SoundManager] Audio context resumed, state:', this.audioContext.state)
            } catch (error) {
                console.error('[SoundManager] Failed to resume audio context:', error)
            }
        } else {
            console.log('[SoundManager] Audio context state:', this.audioContext.state)
        }
    }

    private startBuffer(buffer: AudioBuffer, delaySeconds = 0) {
        if (!this.audioContext) return

        const source = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()

        source.buffer = buffer
        gainNode.gain.value = this.volume

        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)

        const startTime = this.audioContext.currentTime + Math.max(0, delaySeconds)
        source.start(startTime)
    }

    async ensureInitialized() {
        if (!this.isEnabled) {
            console.warn('[SoundManager] Audio is disabled')
            return
        }

        if (!this.audioContext) {
            console.log('[SoundManager] Initializing audio context...')
            await this.initializeAudioContext()
        }

        await this.resumeIfSuspended()
    }

    async playSound(soundName: string) {
        if (!this.isEnabled) return

        try {
            console.log(`[SoundManager] playSound called: "${soundName}"`)
            await this.ensureInitialized()
            if (!this.audioContext) {
                console.error('[SoundManager] No audio context available')
                return
            }

            const buffer = await this.loadBufferForName(soundName)
            if (!buffer) {
                console.warn(`[SoundManager] Sound "${soundName}" not available, using fallback`)
                return
            }

            this.startBuffer(buffer)
            console.log(`[SoundManager] Playing sound: "${soundName}"`)
        } catch (error) {
            console.error('[SoundManager] Failed to play sound:', error)
        }
    }

    // Add debug method to check audio system status
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            hasContext: !!this.audioContext,
            contextState: this.audioContext?.state,
            registeredAliases: audioUrlIndex.size,
            cachedBuffers: this.bufferCache.size,
            sampleAliases: Array.from(audioUrlIndex.entries()).slice(0, 5)
        }
    }

    async playWord(phrase: string) {
        if (!this.isEnabled || !phrase) return

        try {
            await this.ensureInitialized()

            const trimmed = phrase.trim()
            if (!trimmed) return

            // First try: exact phrase as audio file
            if (await this.playVoiceClip(trimmed)) {
                return
            }

            // Second try: for multi-word phrases, try speech synthesis FIRST
            // (Better than trying to play individual words with no delays)
            const parts = trimmed.split(/[\s-]+/).filter(Boolean)
            if (parts.length > 1) {
                if (this.speakWithSpeechSynthesis(trimmed)) {
                    return
                }

                // Third try: play individual words with delays
                let delay = 0
                let anyPlayed = false
                for (const part of parts) {
                    const buffer = await this.loadBufferForName(part, false)
                    if (buffer && this.audioContext) {
                        this.startBuffer(buffer, delay)
                        delay += buffer.duration + 0.1 // 100ms gap between words
                        anyPlayed = true
                    }
                }

                if (anyPlayed) {
                    return
                }
            } else {
                // Single word: try speech synthesis
                if (this.speakWithSpeechSynthesis(trimmed)) {
                    return
                }
            }

            // Final fallback: success tone
            if (this.audioContext) {
                const fallback = await this.loadBufferForName('success')
                if (fallback) {
                    this.startBuffer(fallback)
                }
            }
        } catch (error) {
            console.warn('Failed to play word audio:', error)
        }
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume))
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled
    }

    isInitialized(): boolean {
        return this.audioContext !== null
    }
}

export const soundManager = new SoundManager()

export const playSoundEffect = {
    tap: () => soundManager.playSound('tap'),
    success: () => soundManager.playSound('success'),
    wrong: () => soundManager.playSound('wrong'),
    win: () => soundManager.playSound('win'),
    voice: (phrase: string) => soundManager.playWord(phrase)
}

// Export debug function for troubleshooting
export const getAudioDebugInfo = () => soundManager.getDebugInfo()
