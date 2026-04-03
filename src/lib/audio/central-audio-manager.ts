import { soundManager } from "../sound-manager";

type AudioChannel = "welcome" | "menu" | "gameplay" | "system";

interface ChannelState {
  key: string;
  priority: number;
}

interface PlayManagedOptions {
  key: string;
  channel: AudioChannel;
  priority: number;
  playbackRate?: number;
  volume?: number;
  fadeInMs?: number;
  expectedDurationMs?: number;
}

const PLAYBACK_TIMEOUT_BUFFER_MS = 750;

/**
 * CentralAudioManager
 *
 * Singleton coordinator for managed audio channels.
 * Resolves playback conflicts via deterministic channel priority.
 */
export class CentralAudioManager {
  private static instance: CentralAudioManager | null = null;
  private channelState = new Map<AudioChannel, ChannelState>();
  private channelTokens = new Map<AudioChannel, number>();
  private channelTimers = new Map<
    AudioChannel,
    ReturnType<typeof setTimeout>
  >();

  static getInstance(): CentralAudioManager {
    if (!CentralAudioManager.instance) {
      CentralAudioManager.instance = new CentralAudioManager();
    }
    return CentralAudioManager.instance;
  }

  private clearChannelTimer(channel: AudioChannel) {
    const timer = this.channelTimers.get(channel);
    if (timer) {
      clearTimeout(timer);
      this.channelTimers.delete(channel);
    }
  }

  private clearChannel(channel: AudioChannel) {
    this.clearChannelTimer(channel);
    this.channelState.delete(channel);
    this.channelTokens.delete(channel);
  }

  private nextChannelToken(channel: AudioChannel): number {
    const nextToken = (this.channelTokens.get(channel) ?? 0) + 1;
    this.channelTokens.set(channel, nextToken);
    return nextToken;
  }

  private isCurrentToken(channel: AudioChannel, token: number): boolean {
    return this.channelTokens.get(channel) === token;
  }

  private canPlay(priority: number): boolean {
    for (const [, active] of this.channelState) {
      if (active.priority > priority) return false;
    }
    return true;
  }

  private fadeOutLowerPriorityChannels(priority: number) {
    for (const [channel, active] of this.channelState.entries()) {
      if (active.priority <= priority) {
        soundManager.fadeOutKey(active.key, 160);
        this.clearChannel(channel);
      }
    }
  }

  async playManaged(options: PlayManagedOptions): Promise<boolean> {
    const {
      key,
      channel,
      priority,
      playbackRate = 1,
      volume,
      fadeInMs = 120,
      expectedDurationMs,
    } = options;

    if (!this.canPlay(priority)) {
      if (import.meta.env.DEV) {
        console.log("[CentralAudioManager] Dropping lower-priority playback", {
          key,
          channel,
          priority,
        });
      }
      return false;
    }

    this.fadeOutLowerPriorityChannels(priority);
    const token = this.nextChannelToken(channel);

    this.clearChannelTimer(channel);
    this.channelState.set(channel, { key, priority });

    let playbackTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const playbackResult =
        expectedDurationMs && expectedDurationMs > 0
          ? await Promise.race<boolean>([
              soundManager
                .playSoundWithFadeAsync(key, playbackRate, volume, fadeInMs)
                .then(() => true),
              new Promise<boolean>((resolve) => {
                playbackTimeout = setTimeout(() => {
                  resolve(false);
                }, expectedDurationMs + PLAYBACK_TIMEOUT_BUFFER_MS);
              }),
            ])
          : (await soundManager.playSoundWithFadeAsync(
              key,
              playbackRate,
              volume,
              fadeInMs,
            ),
            true);

      if (!playbackResult) {
        if (this.isCurrentToken(channel, token)) {
          soundManager.fadeOutKey(key, 80);
          this.clearChannel(channel);
        }
        if (import.meta.env.DEV) {
          console.warn("[CentralAudioManager] Managed playback timed out", {
            key,
            channel,
            expectedDurationMs,
          });
        }
        return false;
      }
    } catch (error) {
      if (this.isCurrentToken(channel, token)) {
        this.clearChannel(channel);
      }
      if (import.meta.env.DEV) {
        console.warn("[CentralAudioManager] Managed playback failed", {
          key,
          channel,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return false;
    } finally {
      if (playbackTimeout) {
        clearTimeout(playbackTimeout);
      }
    }

    if (!this.isCurrentToken(channel, token)) {
      soundManager.fadeOutKey(key, 80);
      return false;
    }

    this.clearChannel(channel);

    return true;
  }

  stopChannel(channel: AudioChannel): void {
    const active = this.channelState.get(channel);
    if (active) {
      soundManager.fadeOutKey(active.key, 120);
    }
    this.clearChannel(channel);
  }

  stopAllManaged(): void {
    for (const [channel, active] of Array.from(this.channelState.entries())) {
      soundManager.fadeOutKey(active.key, 120);
      this.clearChannel(channel);
    }
  }

  getActiveChannels(): ReadonlyArray<{
    channel: AudioChannel;
    key: string;
    priority: number;
  }> {
    return Array.from(this.channelState.entries()).map(([channel, state]) => ({
      channel,
      key: state.key,
      priority: state.priority,
    }));
  }
}

export const centralAudioManager = CentralAudioManager.getInstance();
