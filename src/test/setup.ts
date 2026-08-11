/**
 * Test setup for Vitest
 */

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
  state = "running";
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {},
      addEventListener: () => {},
    };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
  resume() {
    return Promise.resolve();
  }
  get currentTime() {
    return 0;
  }
  get destination() {
    return {};
  }
} as unknown as typeof AudioContext;

// Mock HTMLAudioElement
HTMLAudioElement.prototype.play = () => Promise.resolve();
HTMLAudioElement.prototype.pause = () => {};
HTMLAudioElement.prototype.load = () => {};

// Mock SpeechSynthesis
global.speechSynthesis = {
  speak: () => {},
  cancel: () => {},
  pause: () => {},
  resume: () => {},
  getVoices: () => [],
  pending: false,
  speaking: false,
  paused: false,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
} as unknown as SpeechSynthesis;
