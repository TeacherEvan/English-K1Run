// Sound Manager - Simple audio system for the kindergarten game
// Uses Web Audio API for better performance and browser compatibility

class SoundManager {
    private audioContext: AudioContext | null = null
    private sounds: Map<string, AudioBuffer> = new Map()
    private isEnabled: boolean = true
    private volume: number = 0.5

    constructor() {
        this.initializeAudioContext()
    }

    private async initializeAudioContext() {
        try {
            // Create audio context on user interaction to comply with browser policies
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

            // Generate simple sounds procedurally since we don't have audio files
            await this.generateSounds()
        } catch (error) {
            console.warn('Audio context initialization failed:', error)
            this.isEnabled = false
        }
    }

    private async generateSounds() {
        if (!this.audioContext) return

        // Generate success sound (ascending notes)
        const successBuffer = this.createToneSequence([
            { frequency: 523.25, duration: 0.15 }, // C5
            { frequency: 659.25, duration: 0.15 }, // E5
            { frequency: 783.99, duration: 0.3 }   // G5
        ])
        this.sounds.set('success', successBuffer)

        // Generate tap sound (quick pop)
        const tapBuffer = this.createTone(800, 0.1, 'square')
        this.sounds.set('tap', tapBuffer)

        // Generate wrong sound (descending)
        const wrongBuffer = this.createToneSequence([
            { frequency: 400, duration: 0.15 },
            { frequency: 300, duration: 0.15 },
            { frequency: 200, duration: 0.2 }
        ])
        this.sounds.set('wrong', wrongBuffer)

        // Generate win sound (celebratory)
        const winBuffer = this.createToneSequence([
            { frequency: 523.25, duration: 0.2 }, // C5
            { frequency: 659.25, duration: 0.2 }, // E5
            { frequency: 783.99, duration: 0.2 }, // G5
            { frequency: 1046.50, duration: 0.4 } // C6
        ])
        this.sounds.set('win', winBuffer)
    }

    private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
        if (!this.audioContext) throw new Error('Audio context not available')

        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * duration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)

        for (let i = 0; i < frameCount; i++) {
            const time = i / sampleRate
            let sample = 0

            switch (type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * time)
                    break
                case 'square':
                    sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1
                    break
                case 'triangle':
                    sample = 2 * Math.abs(2 * (frequency * time - Math.floor(frequency * time + 0.5))) - 1
                    break
            }

            // Apply envelope (fade in/out)
            const envelope = Math.min(
                time * 10, // Fade in
                1,
                (duration - time) * 10 // Fade out
            )

            channelData[i] = sample * envelope * 0.3 // Reduce volume
        }

        return buffer
    }

    private createToneSequence(notes: { frequency: number, duration: number }[]): AudioBuffer {
        if (!this.audioContext) throw new Error('Audio context not available')

        const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0)
        const sampleRate = this.audioContext.sampleRate
        const frameCount = sampleRate * totalDuration
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
        const channelData = buffer.getChannelData(0)

        let currentFrame = 0
        for (const note of notes) {
            const noteFrames = sampleRate * note.duration
            for (let i = 0; i < noteFrames; i++) {
                const time = i / sampleRate
                const sample = Math.sin(2 * Math.PI * note.frequency * time)

                // Apply envelope
                const envelope = Math.min(
                    time * 20, // Quick fade in
                    1,
                    (note.duration - time) * 10 // Fade out
                )

                if (currentFrame + i < frameCount) {
                    channelData[currentFrame + i] = sample * envelope * 0.2
                }
            }
            currentFrame += noteFrames
        }

        return buffer
    }

    async ensureInitialized() {
        if (!this.audioContext) {
            await this.initializeAudioContext()
        }
    }

    async playSound(soundName: string) {
        if (!this.isEnabled) return

        try {
            // Ensure audio context is initialized
            if (!this.audioContext) {
                await this.initializeAudioContext()
            }

            if (!this.audioContext || this.audioContext.state === 'suspended') {
                // Try to resume audio context
                if (this.audioContext) {
                    await this.audioContext.resume()
                }
            }

            if (!this.audioContext) {
                console.warn('Audio context not available')
                return
            }

            const buffer = this.sounds.get(soundName)
            if (!buffer) {
                console.warn(`Sound "${soundName}" not found`)
                return
            }

            const source = this.audioContext.createBufferSource()
            const gainNode = this.audioContext.createGain()

            source.buffer = buffer
            gainNode.gain.value = this.volume

            source.connect(gainNode)
            gainNode.connect(this.audioContext.destination)

            source.start()
        } catch (error) {
            console.warn('Failed to play sound:', error)
            // Don't disable the system completely, just log the error
        }
    } setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume))
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled
    }

    isInitialized(): boolean {
        return this.audioContext !== null
    }
}

// Create singleton instance
export const soundManager = new SoundManager()

// Sound effect helpers
export const playSoundEffect = {
    tap: () => soundManager.playSound('tap'),
    success: () => soundManager.playSound('success'),
    wrong: () => soundManager.playSound('wrong'),
    win: () => soundManager.playSound('win')
}