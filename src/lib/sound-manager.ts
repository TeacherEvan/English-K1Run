// Sound Manager - Enhanced audio system that supports wav assets and speech-like cues

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

// Educational sentence templates for each item
const SENTENCE_TEMPLATES: Record<string, string> = {
    // Fruits & Vegetables
    'apple': 'I eat a red apple',
    'banana': 'The banana is yellow and sweet',
    'grapes': 'I love purple grapes',
    'strawberry': 'The strawberry is red and juicy',
    'carrot': 'The rabbit eats a crunchy carrot',
    'cucumber': 'The cucumber is green and fresh',
    'watermelon': 'The watermelon is big and sweet',
    'broccoli': 'Eat your green broccoli',
    'orange': 'The orange is round and juicy',
    'lemon': 'The lemon is yellow and sour',
    'peach': 'The peach is soft and sweet',
    'cherry': 'The cherry is red and small',
    'kiwi': 'The kiwi is fuzzy and green',

    // Counting
    'one': 'I see one star',
    '1': 'I see one star',
    'two': 'I have two hands',
    '2': 'I have two hands',
    'three': 'Three little birds',
    '3': 'Three little birds',
    'four': 'Four wheels on a car',
    '4': 'Four wheels on a car',
    'five': 'Give me five',
    '5': 'Give me five',
    'six': 'Six legs on a bug',
    '6': 'Six legs on a bug',
    'seven': 'Seven colors in a rainbow',
    '7': 'Seven colors in a rainbow',
    'eight': 'Eight legs on a spider',
    '8': 'Eight legs on a spider',
    'nine': 'Nine planets in space',
    '9': 'Nine planets in space',
    'ten': 'I can count to ten',
    '10': 'I can count to ten',
    'eleven': 'I can count to eleven',
    '11': 'I can count to eleven',
    'twelve': 'Twelve months in a year',
    '12': 'Twelve months in a year',
    'thirteen': 'Thirteen is a lucky number',
    '13': 'Thirteen is a lucky number',
    'fourteen': 'I am learning to count to fourteen',
    '14': 'I am learning to count to fourteen',
    'fifteen': 'Fifteen minutes to play',
    '15': 'Fifteen minutes to play',

    // Shapes & Colors
    'blue': 'The sky is blue',
    'red': 'The apple is red',
    'orange': 'The pumpkin is orange',
    'green': 'The grass is green',
    'yellow': 'The sun is yellow',
    'brown': 'The bear is brown',
    'black': 'The night is black',
    'purple': 'The grapes are purple',
    'white': 'The snow is white',
    'triangle': 'The triangle has three sides',
    'star': 'The star shines bright',
    'diamond': 'The diamond sparkles',
    'circle': 'The ball is a circle',

    // Animals & Nature
    'dog': 'The dog wags its tail',
    'cat': 'The cat purrs softly',
    'fox': 'The fox is quick and clever',
    'turtle': 'The turtle moves slowly',
    'butterfly': 'The butterfly flies in the garden',
    'owl': 'The owl hoots at night',
    'tree': 'The tree grows tall',
    'flower': 'The flower smells sweet',
    'elephant': 'The elephant has a long trunk',
    'lion': 'The lion roars loudly',
    'rabbit': 'The rabbit hops around',
    'giraffe': 'The giraffe has a long neck',
    'penguin': 'The penguin waddles on ice',

    // Things That Go
    'car': 'The car drives on the road',
    'bus': 'The yellow bus takes us to school',
    'fire truck': 'The fire truck has a loud siren',
    'airplane': 'The airplane flies in the sky',
    'rocket': 'The rocket goes to space',
    'bicycle': 'I ride my bicycle to the park',
    'helicopter': 'The helicopter goes up and down',
    'boat': 'The boat floats on the water',
    'train': 'The train goes on the tracks',
    'taxi': 'The taxi takes people places',
    'van': 'The van carries our family',
    'scooter': 'I ride my scooter fast',
    'motorcycle': 'The motorcycle goes zoom',

    // Weather Wonders
    'sunny': 'It is sunny today',
    'cloudy': 'The sky is cloudy',
    'rainy': 'It is rainy outside',
    'stormy': 'The weather is stormy',
    'snowy': 'It is snowy and cold',
    'rainbow': 'I see a beautiful rainbow',
    'tornado': 'The tornado spins around',
    'windy': 'It is very windy today',
    'moon': 'The moon shines at night',
    'star': 'The stars twinkle',
    'sun': 'The sun gives us light',
    'foggy': 'The morning is foggy',
    'lightning': 'The lightning flashes bright',

    // Feelings & Actions
    'happy': 'I feel happy and smile',
    'sad': 'When I am sad I might cry',
    'angry': 'Take a breath when you feel angry',
    'sleepy': 'I am sleepy and yawn',
    'hug': 'Give me a big hug',
    'clap': 'Clap your hands together',
    'dance': 'Let\'s dance to the music',
    'flip': 'Watch me flip and spin',
    'smile': 'I smile when I am happy',
    'laugh': 'I laugh at funny jokes',
    'think': 'I think before I speak',
    'celebrate': 'Let\'s celebrate together',
    'wave': 'I wave hello to my friends',

    // Body Parts
    // Note: The sentences below intentionally use plural forms ("eyes", "ears", "feet", "legs") for anatomical accuracy,
    // even though the game items are named in the singular ("eye", "ear", "foot", "leg").
    // This is because humans typically reference these body parts in pairs.
    'eye': 'I see with my eyes',
    'ear': 'I hear with my ears',
    'nose': 'I smell with my nose',
    'mouth': 'I talk with my mouth',
    'tongue': 'My tongue tastes food',
    'hand': 'I wave my hand hello',
    'foot': 'I walk with my feet',
    'leg': 'I jump with my legs',
    'tooth': 'I brush my teeth',
    'arm': 'I swing my arms',
    'brain': 'My brain helps me think',
    'heart': 'My heart beats in my chest',

    // Alphabet (letters A-O)
    'a': 'The letter A',
    'b': 'The letter B',
    'c': 'The letter C',
    'd': 'The letter D',
    'e': 'The letter E',
    'f': 'The letter F',
    'g': 'The letter G',
    'h': 'The letter H',
    'i': 'The letter I',
    'j': 'The letter J',
    'k': 'The letter K',
    'l': 'The letter L',
    'm': 'The letter M',
    'n': 'The letter N',
    'o': 'The letter O',
}

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

        if (this.isMobile) {
            console.log('[SoundManager] Mobile device detected - using Web Audio API for correct playback')
        }
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
            audio.playbackRate = 1.0 // Ensure normal speed (prevents frog/chipmunk voices)

            const cleanup = () => {
                audio.removeEventListener('ended', handleEnded)
                audio.removeEventListener('error', handleError)
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
            console.warn('[SoundManager] Speech synthesis not available in this environment')
            return false
        }

        this.speechAvailable = true
        console.log('[SoundManager] Speech synthesis is available')
        return true
    }

    private speakWithSpeechSynthesis(text: string): boolean {
        console.log(`[SoundManager] Attempting speech synthesis for: "${text}"`)

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
            utterance.rate = 1.0  // Normal speed for clear pronunciation
            utterance.pitch = 1.0  // Natural pitch for better voice quality
            utterance.volume = this.volume

            // Add event listeners for debugging
            utterance.onstart = () => {
                console.log(`[SoundManager] Started speaking: "${text}"`)
                eventTracker.trackAudioPlayback({
                    audioKey: text,
                    targetName: text,
                    method: 'speech-synthesis',
                    success: true
                })
            }

            utterance.onend = () => {
                console.log(`[SoundManager] Finished speaking: "${text}"`)
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

            synth.cancel() // Cancel any ongoing speech
            synth.speak(utterance)

            console.log('[SoundManager] Speech synthesis initiated successfully')
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

            // On Android, prefer HTMLAudio for better compatibility
            if (this.preferHTMLAudio) {
                const candidates = this.resolveCandidates(soundName)
                for (const candidate of candidates) {
                    const played = await this.playWithHtmlAudio(candidate)
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

            const startTime = performance.now()

            // PRIORITY 1: Look up sentence template for educational context
            const normalizedPhrase = trimmed.toLowerCase()
            const sentence = SENTENCE_TEMPLATES[normalizedPhrase]

            if (sentence) {
                // We have a sentence template, speak the full sentence FIRST
                console.log(`[SoundManager] Using sentence template for "${trimmed}": "${sentence}"`)
                if (this.speakWithSpeechSynthesis(sentence)) {
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
            if (await this.playVoiceClip(trimmed)) {
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
                if (this.speakWithSpeechSynthesis(trimmed)) {
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
                        this.startBuffer(buffer, delay)
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
                if (this.speakWithSpeechSynthesis(trimmed)) {
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
}

export const soundManager = new SoundManager()

export const playSoundEffect = {
    voice: (phrase: string) => soundManager.playWord(phrase)
    // Other sound effects (tap, success, wrong, win) removed - only target pronunciation allowed
}

// Export debug function for troubleshooting
export const getAudioDebugInfo = () => soundManager.getDebugInfo()
