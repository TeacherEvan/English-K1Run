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

    registerAudioAlias(normalized, url)

    if (fileName.startsWith('emoji_')) {
        const trimmed = fileName.slice(6)
        registerAudioAlias(normalizeKey(trimmed), url)
        registerAudioAlias(normalizeKey(trimmed.replace(/_/g, ' ')), url)
    }

    const strippedEmoji = fileName.replace(/^emoji_/, '')
    if (strippedEmoji !== fileName) {
        registerAudioAlias(normalizeKey(strippedEmoji), url)
    }

    if (DIGIT_TO_WORD[fileName]) {
        registerAudioAlias(normalizeKey(DIGIT_TO_WORD[fileName]), url)
    }

    if (NUMBER_WORD_TO_DIGIT[fileName]) {
        registerAudioAlias(normalizeKey(NUMBER_WORD_TO_DIGIT[fileName]), url)
    }

    if (fileName.includes('_')) {
        for (const part of fileName.split('_')) {
            registerAudioAlias(normalizeKey(part), url)
        }
    }
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

    constructor() {
        void this.initializeAudioContext()
    }

    private async initializeAudioContext() {
        if (this.audioContext) return

        try {
            const ContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            this.audioContext = new ContextClass()
            this.prepareFallbackEffects()
        } catch (error) {
            console.warn('Audio context initialization failed:', error)
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
        if (!url) return null

        const loadPromise = (async () => {
            try {
                const response = await fetch(url)
                const arrayBuffer = await response.arrayBuffer()
                const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
                this.bufferCache.set(key, audioBuffer)
                this.loadingCache.delete(key)
                return audioBuffer
            } catch (error) {
                console.warn(`Failed to load audio "${key}":`, error)
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
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume()
            } catch (error) {
                console.warn('Failed to resume audio context:', error)
            }
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
        if (!this.isEnabled) return

        if (!this.audioContext) {
            await this.initializeAudioContext()
        }

        await this.resumeIfSuspended()
    }

    async playSound(soundName: string) {
        if (!this.isEnabled) return

        try {
            await this.ensureInitialized()
            if (!this.audioContext) return

            const buffer = await this.loadBufferForName(soundName)
            if (!buffer) {
                console.warn(`Sound "${soundName}" not available`)
                return
            }

            this.startBuffer(buffer)
        } catch (error) {
            console.warn('Failed to play sound:', error)
        }
    }

    async playWord(phrase: string) {
        if (!this.isEnabled || !phrase) return

        try {
            await this.ensureInitialized()

            const trimmed = phrase.trim()
            if (!trimmed) return

            if (await this.playVoiceClip(trimmed)) {
                return
            }

            const parts = trimmed.split(/[\s-]+/).filter(Boolean)
            if (parts.length > 1) {
                let allPlayed = true

                for (const part of parts) {
                    const partPlayed = await this.playVoiceClip(part)
                    if (!partPlayed) {
                        allPlayed = false
                        break
                    }
                }

                if (allPlayed) {
                    return
                }
            }

            if (this.speakWithSpeechSynthesis(trimmed)) {
                return
            }

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