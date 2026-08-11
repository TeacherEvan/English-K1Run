import type { Page } from "@playwright/test";

/**
 * Audio Mock - Prevents actual audio playback during tests
 */
export class AudioMock {
  private playedSounds: string[] = [];

  constructor(private page: Page) {}

  async setup() {
    await this.page.addInitScript(() => {
      void (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      );

      class MockAudioContext {
        state = "running";
        destination = { numberOfInputs: 0 };
        currentTime = 0;
        sampleRate = 44100;

        createGain() {
          return {
            gain: { value: 1, setValueAtTime: () => {} },
            connect: () => {},
            disconnect: () => {},
          };
        }

        createOscillator() {
          return {
            type: "sine",
            frequency: { value: 440, setValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {},
          };
        }

        createBufferSource() {
          return {
            buffer: null,
            connect: () => {},
            start: () => {},
            stop: () => {},
            loop: false,
            playbackRate: { value: 1 },
          };
        }

        decodeAudioData() {
          return Promise.resolve({
            duration: 1,
            numberOfChannels: 2,
            sampleRate: 44100,
            length: 44100,
            getChannelData: () => new Float32Array(44100),
          });
        }

        resume() {
          this.state = "running";
          return Promise.resolve();
        }

        suspend() {
          this.state = "suspended";
          return Promise.resolve();
        }

        close() {
          this.state = "closed";
          return Promise.resolve();
        }
      }

      (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
        MockAudioContext;
      (
        window as unknown as { webkitAudioContext: typeof MockAudioContext }
      ).webkitAudioContext = MockAudioContext;

      HTMLAudioElement.prototype.play = function () {
        return Promise.resolve();
      };

      if ("speechSynthesis" in window) {
        window.speechSynthesis.speak = () => {};
        window.speechSynthesis.cancel = () => {};
      }
    });
  }

  getPlayedSounds() {
    return this.playedSounds;
  }
}
