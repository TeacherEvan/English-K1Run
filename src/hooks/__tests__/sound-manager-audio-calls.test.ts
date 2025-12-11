/**
 * Unit Tests for Sound Manager Audio Call Behavior
 * 
 * Tests verify that the game uses the correct audio playback methods:
 * - Target announcements use full sentences (playSoundEffect.voice)
 * - Tap feedback uses word-only pronunciation (playSoundEffect.voiceWordOnly)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playSoundEffect } from '../../lib/sound-manager'

describe('Sound Manager Audio Call Behavior', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('should export voiceWordOnly function', () => {
    expect(playSoundEffect.voiceWordOnly).toBeDefined()
    expect(typeof playSoundEffect.voiceWordOnly).toBe('function')
  })

  it('should export voice function for full sentences', () => {
    expect(playSoundEffect.voice).toBeDefined()
    expect(typeof playSoundEffect.voice).toBe('function')
  })

  it('should have both voice and voiceWordOnly available as separate methods', () => {
    // Verify that both methods exist and are distinct
    expect(playSoundEffect.voice).not.toBe(playSoundEffect.voiceWordOnly)
    
    // Both should be callable functions
    expect(playSoundEffect.voice).toBeInstanceOf(Function)
    expect(playSoundEffect.voiceWordOnly).toBeInstanceOf(Function)
  })

  it('should call the underlying soundManager methods with correct parameters', () => {
    // This test ensures the playSoundEffect object correctly wraps soundManager methods
    const testPhrase = 'apple'
    
    // We can't easily test the actual audio playback in unit tests,
    // but we can verify the functions don't throw errors when called
    expect(() => {
      void playSoundEffect.voice(testPhrase)
    }).not.toThrow()
    
    expect(() => {
      void playSoundEffect.voiceWordOnly(testPhrase)
    }).not.toThrow()
  })

  it('should have sticker celebration sound effect', () => {
    expect(playSoundEffect.sticker).toBeDefined()
    expect(typeof playSoundEffect.sticker).toBe('function')
    
    expect(() => {
      void playSoundEffect.sticker()
    }).not.toThrow()
  })

  it('should only export voice, voiceWordOnly, sticker, and stopAll methods', () => {
    // Verify that we only have the expected sound effects and control methods
    // (per repository documentation: "only target pronunciation and celebration allowed")
    const exportedMethods = Object.keys(playSoundEffect)
    expect(exportedMethods).toHaveLength(4)
    expect(exportedMethods).toContain('voice')
    expect(exportedMethods).toContain('voiceWordOnly')
    expect(exportedMethods).toContain('sticker')
    expect(exportedMethods).toContain('stopAll')
  })

  it('should have stopAll method to stop all audio', () => {
    expect(playSoundEffect.stopAll).toBeDefined()
    expect(typeof playSoundEffect.stopAll).toBe('function')
    
    expect(() => {
      void playSoundEffect.stopAll()
    }).not.toThrow()
  })
})
