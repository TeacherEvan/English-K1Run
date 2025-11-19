// Sound Manager - Enhanced audio system that supports wav assets and speech-like cues

import { getPhonics } from './constants/phonics-map'
import { SENTENCE_TEMPLATES } from './constants/sentence-templates'
import { eventTracker } from './event-tracker'

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
    private activeSources: Map<string, AudioBufferSourceNode> = new Map() // Track active audio sources
    private activeHtmlAudio: Map<string, HTMLAudioElement> = new Map() // Track active HTML audio elements
    private isEnabled = true
    private volume = 0.6
    private speechAvailable: boolean | null = null
    private initAttempted = false // Track if we've tried to initialize
    private userInteractionReceived = false
    private isMobile = false
    private preferHTMLAudio = false

    constructor() {
        this.detectMobile()
        void this.initializeAudioContext()
        this.setupUserInteractionListener()
    }

    private detectMobile() {
        // Detect if we're on a mobile device
        const ua = navigator.userAgent.toLowerCase()
        this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)

        // ALWAYS use Web Audio API for better quality and correct playback speed
        // HTMLAudio can cause pitch/speed issues (sounds like frogs/chipmunks)
        this.preferHTMLAudio = false

        if (this.isMobile && import.meta.env.DEV) {
            console.log('[SoundManager] Mobile device detected - using Web Audio API for correct playback')
        }
    }

    private setupUserInteractionListener() {
        // Set up one-time listeners for user interaction to unlock audio
        const handleInteraction = async () => {
            if (this.userInteractionReceived) return
            this.userInteractionReceived = true

            if (import.meta.env.DEV) {
                console.log('[SoundManager] User interaction detected, initializing audio...')
            }
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
            if (import.meta.env.DEV) {
                console.log('[SoundManager] Audio context created, state:', this.audioContext.state)
            }
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
                if (import.meta.env.DEV) {
                    console.log(`[SoundManager] Loading audio: "${key}" from ${url}`)
                }
                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
                const arrayBuffer = await response.arrayBuffer()
                const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
                this.bufferCache.set(key, audioBuffer)
                this.loadingCache.delete(key)
                if (import.meta.env.DEV) {
                    console.log(`[SoundManager] Successfully loaded: "${key}"`)
                }
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

    private async playWithHtmlAudio(key: string, playbackRate = 0.8, maxDuration?: number, volumeOverride?: number): Promise<boolean> {
        const url = audioUrlIndex.get(key)
        if (!url) return false

        // Stop any previous instance of this sound
        if (this.activeHtmlAudio.has(key)) {
            try {
                const prevAudio = this.activeHtmlAudio.get(key)!
                prevAudio.pause()
                prevAudio.currentTime = 0
                this.activeHtmlAudio.delete(key)
            } catch {
                // Ignore errors from stopping already-stopped audio
            }
        }

        if (!this.htmlAudioCache.has(key)) {
            this.htmlAudioCache.set(key, url)
        }

        return await new Promise<boolean>((resolve) => {
            const audio = new Audio(url)
            audio.preload = 'auto'
            audio.crossOrigin = 'anonymous'
            audio.volume = volumeOverride ?? this.volume
            audio.playbackRate = playbackRate // Use provided playback rate

            // Track this audio element
            this.activeHtmlAudio.set(key, audio)

            let maxDurationTimer: number | undefined

            const cleanup = () => {
                audio.removeEventListener('ended', handleEnded)
                audio.removeEventListener('error', handleError)
                if (maxDurationTimer !== undefined) {
                    window.clearTimeout(maxDurationTimer)
                }
                this.activeHtmlAudio.delete(key)
            }

            const forceStop = () => {
                if (audio && !audio.paused) {
                    audio.pause()
                    audio.currentTime = 0
                }
                cleanup()
                if (import.meta.env.DEV) {
                    console.log(`[SoundManager] Force-stopped "${key}" after ${maxDuration}ms`)
                }
                resolve(true)
            }

            const handleEnded = () => {
                cleanup()
                eventTracker.trackAudioPlayback({
                    audioKey: key,
                    targetName: key,
                    method: 'html-audio',
                    success: true,
                    duration: audio.duration
                })
                resolve(true)
            }

            const handleError = (event: Event) => {
                console.warn(`HTMLAudio playback failed for "${key}"`, event)
                cleanup()
                eventTracker.trackAudioPlayback({
                    audioKey: key,
                    targetName: key,
                    method: 'html-audio',
                    success: false,
                    error: 'playback_error'
                })
                resolve(false)
            }

            audio.addEventListener('ended', handleEnded, { once: true })
            audio.addEventListener('error', handleError, { once: true })

            // Set up max duration timer if specified
            if (maxDuration !== undefined && maxDuration > 0) {
                maxDurationTimer = window.setTimeout(forceStop, maxDuration)
            }

            audio.play().catch(error => {
                console.warn(`Unable to start audio element for "${key}":`, error)
                cleanup()
                eventTracker.trackAudioPlayback({
                    audioKey: key,
                    targetName: key,
                    method: 'html-audio',
                    success: false,
                    error: error.message || 'play_error'
                })
                resolve(false)
            })
        })
    }

    private async playVoiceClip(name: string, playbackRate = 0.8, maxDuration?: number, volumeOverride?: number): Promise<boolean> {
        const candidates = this.resolveCandidates(name)

        for (const candidate of candidates) {
            const played = await this.playWithHtmlAudio(candidate, playbackRate, maxDuration, volumeOverride)
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
            console.warn('[SoundManager] Speech synthesis not available in this environment')
            return false
        }

        this.speechAvailable = true
        if (import.meta.env.DEV) {
            console.log('[SoundManager] Speech synthesis is available')
        }
        return true
    }

    private speakWithSpeechSynthesis(text: string, volumeOverride?: number): boolean {
        if (import.meta.env.DEV) {
            console.log(`[SoundManager] Attempting speech synthesis for: "${text}"`)
        }

        if (!this.canUseSpeech()) {
            console.warn('[SoundManager] Cannot use speech - not available')
            eventTracker.trackAudioPlayback({
                audioKey: text,
                targetName: text,
                method: 'speech-synthesis',
                success: false,
                error: 'not_available'
            })
            return false
        }

        try {
            const synth = window.speechSynthesis
            if (!synth) {
                console.warn('[SoundManager] speechSynthesis object not found')
                eventTracker.trackAudioPlayback({
                    audioKey: text,
                    targetName: text,
                    method: 'speech-synthesis',
                    success: false,
                    error: 'synth_not_found'
                })
                return false
            }

            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 0.8  // 20% slower for clearer kindergarten comprehension
            utterance.pitch = 1.0  // Natural pitch for better voice quality
            utterance.volume = volumeOverride ?? this.volume

            // Add event listeners for debugging
            utterance.onstart = () => {
                if (import.meta.env.DEV) {
                    console.log(`[SoundManager] Started speaking: "${text}"`)
                }
                eventTracker.trackAudioPlayback({
                    audioKey: text,
                    targetName: text,
                    method: 'speech-synthesis',
                    success: true
                })
            }

            utterance.onend = () => {
                if (import.meta.env.DEV) {
                    console.log(`[SoundManager] Finished speaking: "${text}"`)
                }
            }

            utterance.onerror = (event) => {
                console.error('[SoundManager] Speech synthesis error:', event)
                eventTracker.trackAudioPlayback({
                    audioKey: text,
                    targetName: text,
                    method: 'speech-synthesis',
                    success: false,
                    error: event.error || 'unknown_error'
                })
            }

            // Don't cancel ongoing speech - this interrupts phonics sequences and target announcements
            // The Web Speech API will queue utterances naturally
            synth.speak(utterance)

            if (import.meta.env.DEV) {
                console.log('[SoundManager] Speech synthesis initiated successfully')
            }
            return true
        } catch (error) {
            console.warn('[SoundManager] Speech synthesis failed:', error)
            this.speechAvailable = false
            eventTracker.trackAudioPlayback({
                audioKey: text,
                targetName: text,
                method: 'speech-synthesis',
                success: false,
                error: error instanceof Error ? error.message : 'exception'
            })
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
                if (import.meta.env.DEV) {
                    console.log('[SoundManager] Resuming suspended audio context...')
                }
                await this.audioContext.resume()
                if (import.meta.env.DEV) {
                    console.log('[SoundManager] Audio context resumed, state:', this.audioContext.state)
                }
            } catch (error) {
                console.error('[SoundManager] Failed to resume audio context:', error)
            }
        } else if (import.meta.env.DEV) {
            console.log('[SoundManager] Audio context state:', this.audioContext.state)
        }
    }

    private startBuffer(buffer: AudioBuffer, delaySeconds = 0, soundKey?: string, playbackRate = 0.8, volumeOverride?: number) {
        if (!this.audioContext) return

        // Stop any previous instance of this sound
        if (soundKey && this.activeSources.has(soundKey)) {
            try {
                const prevSource = this.activeSources.get(soundKey)!
                prevSource.stop()
                this.activeSources.delete(soundKey)
            } catch {
                // Ignore errors from stopping already-stopped sources
            }
        }

        const source = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()

        source.buffer = buffer
        source.playbackRate.value = playbackRate // Use provided playback rate
        gainNode.gain.value = volumeOverride ?? this.volume

        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)

        const startTime = this.audioContext.currentTime + Math.max(0, delaySeconds)
        source.start(startTime)

        // Track this source and auto-cleanup when it ends
        if (soundKey) {
            this.activeSources.set(soundKey, source)
            source.onended = () => {
                this.activeSources.delete(soundKey)
            }
        }
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

    async playSound(soundName: string, playbackRate = 1.0) {
        if (!this.isEnabled) return

        try {
            console.log(`[SoundManager] playSound called: "${soundName}"`)

            // On Android, prefer HTMLAudio for better compatibility
            if (this.preferHTMLAudio) {
                const candidates = this.resolveCandidates(soundName)
                for (const candidate of candidates) {
                    const played = await this.playWithHtmlAudio(candidate, playbackRate)
                    if (played) {
                        console.log(`[SoundManager] Played with HTMLAudio: "${soundName}"`)
                        return
                    }
                }
                console.warn(`[SoundManager] HTMLAudio failed for "${soundName}", falling back to Web Audio`)
            }

            // Fall back to Web Audio API
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

            this.startBuffer(buffer, 0, soundName, playbackRate)
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

    async playWord(phrase: string, volumeOverride?: number) {
        if (!this.isEnabled || !phrase) return

        try {
            await this.ensureInitialized()

            const trimmed = phrase.trim()
            if (!trimmed) return

            const startTime = performance.now()
            const normalizedPhrase = trimmed.toLowerCase()

            // PRIORITY 1: Look up sentence template for educational context
            const sentence = SENTENCE_TEMPLATES[normalizedPhrase]

            if (sentence) {
                // We have a sentence template, speak the full sentence FIRST
                console.log(`[SoundManager] Using sentence template for "${trimmed}": "${sentence}"`)
                if (this.speakWithSpeechSynthesis(sentence, volumeOverride)) {
                    console.log(`[SoundManager] Successfully spoke sentence via speech synthesis`)
                    const duration = performance.now() - startTime
                    eventTracker.trackAudioPlayback({
                        audioKey: normalizedPhrase,
                        targetName: trimmed,
                        method: 'speech-synthesis',
                        success: true,
                        duration
                    })
                    return
                } else {
                    console.warn(`[SoundManager] Speech synthesis failed for sentence, falling back`)
                }
            }

            // PRIORITY 2: Try exact phrase as audio file (only if no sentence template exists)
            if (await this.playVoiceClip(trimmed, 0.8, undefined, volumeOverride)) {
                const duration = performance.now() - startTime
                const candidates = this.resolveCandidates(trimmed)
                const successfulKey = candidates.find(c => audioUrlIndex.has(c)) || trimmed
                eventTracker.trackAudioPlayback({
                    audioKey: successfulKey,
                    targetName: trimmed,
                    method: 'wav',
                    success: true,
                    duration
                })
                return
            }

            // PRIORITY 3: For multi-word phrases, try speech synthesis
            const parts = trimmed.split(/[\s-]+/).filter(Boolean)
            if (parts.length > 1) {
                if (this.speakWithSpeechSynthesis(trimmed, volumeOverride)) {
                    const duration = performance.now() - startTime
                    eventTracker.trackAudioPlayback({
                        audioKey: trimmed,
                        targetName: trimmed,
                        method: 'speech-synthesis',
                        success: true,
                        duration
                    })
                    return
                }

                // Fourth try: play individual words with delays
                let delay = 0
                let anyPlayed = false
                for (const part of parts) {
                    const buffer = await this.loadBufferForName(part, false)
                    if (buffer && this.audioContext) {
                        this.startBuffer(buffer, delay, undefined, 0.8, volumeOverride)
                        delay += buffer.duration + 0.1 // 100ms gap between words
                        anyPlayed = true
                    }
                }

                if (anyPlayed) {
                    const duration = performance.now() - startTime
                    eventTracker.trackAudioPlayback({
                        audioKey: trimmed,
                        targetName: trimmed,
                        method: 'wav',
                        success: true,
                        duration
                    })
                    return
                }
            } else {
                // Single word: try speech synthesis
                if (this.speakWithSpeechSynthesis(trimmed, volumeOverride)) {
                    const duration = performance.now() - startTime
                    eventTracker.trackAudioPlayback({
                        audioKey: trimmed,
                        targetName: trimmed,
                        method: 'speech-synthesis',
                        success: true,
                        duration
                    })
                    return
                }
            }

            // No audio played successfully
            eventTracker.trackAudioPlayback({
                audioKey: trimmed,
                targetName: trimmed,
                method: 'fallback-tone',
                success: false,
                error: 'no_audio_available'
            })
        } catch (error) {
            console.warn('Failed to play word audio:', error)
            eventTracker.trackAudioPlayback({
                audioKey: phrase,
                targetName: phrase,
                method: 'fallback-tone',
                success: false,
                error: error instanceof Error ? error.message : 'exception'
            })
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

    // Public method for custom speech synthesis with options
    async playSpeech(text: string, options?: { pitch?: number; rate?: number; volume?: number }) {
        if (!this.isEnabled || !text) return

        try {
            if (!this.canUseSpeech()) {
                console.warn('[SoundManager] Speech synthesis not available')
                return
            }

            const synth = window.speechSynthesis
            if (!synth) return

            const utterance = new SpeechSynthesisUtterance(text)
            utterance.pitch = options?.pitch ?? 1.0
            utterance.rate = options?.rate ?? 1.0
            utterance.volume = options?.volume ?? this.volume

            synth.speak(utterance)

            if (import.meta.env.DEV) {
                console.log(`[SoundManager] Speaking with custom options: "${text}"`, options)
            }
        } catch (error) {
            console.error('[SoundManager] Custom speech synthesis error:', error)
        }
    }
    /**
     * Play word with phonics breakdown
     * Example: "apple" → "Aah! Aah! - Apple!"
     * Prioritizes human voice - background sounds play at reduced volume
     */
    async playWithPhonics(word: string, backgroundSound?: string) {
        if (!this.isEnabled) return

        const phonics = getPhonics(word)

        if (phonics) {
            // Play phonics sequence: [sound1, sound2, fullWord]
            const [sound1, sound2, fullWord] = phonics

            // Play background sound at reduced volume (30%) if provided
            // IMPORTANT: Do NOT await this, so it plays concurrently with phonics
            if (backgroundSound) {
                this.playWord(backgroundSound, 0.3).catch(e => {
                    console.warn('[SoundManager] Background sound failed:', e)
                })
            }

            // Play phonics with priority (human voice at 100% volume)
            await this.playSpeech(sound1, { pitch: 1.1, rate: 0.9, volume: 1.0 })
            await new Promise(resolve => setTimeout(resolve, 300)) // Pause between phonics

            await this.playSpeech(sound2, { pitch: 1.1, rate: 0.9, volume: 1.0 })
            await new Promise(resolve => setTimeout(resolve, 200)) // Pause before full word

            // Pronounce full word
            await this.playWord(fullWord)

            if (import.meta.env.DEV) {
                console.log(`[SoundManager] Played with phonics: ${sound1} ${sound2} - ${fullWord}`)
            }
        } else {
            // Fallback to regular pronunciation if no phonics mapping
            if (backgroundSound) {
                this.playWord(backgroundSound, 0.3).catch(e => {
                    console.warn('[SoundManager] Background sound failed:', e)
                })
            }
            await this.playWord(word)
        }
    }
}

export const soundManager = new SoundManager()

export const playSoundEffect = {
    voice: (phrase: string) => soundManager.playWord(phrase),
    voiceWithPhonics: (word: string, backgroundSound?: string) => soundManager.playWithPhonics(word, backgroundSound),
    sticker: () => {
        // Play excited "GIVE THEM A STICKER!" voice using speech synthesis
        soundManager.playSpeech('GIVE THEM A STICKER!', { pitch: 1.2, rate: 1.1 })
    }
    // Other sound effects removed - only target pronunciation and celebration allowed
}

// Export debug function for troubleshooting
export const getAudioDebugInfo = () => soundManager.getDebugInfo()
