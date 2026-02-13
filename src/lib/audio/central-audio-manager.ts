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

/**
 * CentralAudioManager
 *
 * Singleton coordinator for managed audio channels.
 * Resolves playback conflicts via deterministic channel priority.
 */
export class CentralAudioManager {
  private static instance: CentralAudioManager | null = null;
  private channelState = new Map<AudioChannel, ChannelState>();
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

    await soundManager.playSoundWithFade(key, playbackRate, volume, fadeInMs);
    this.clearChannelTimer(channel);
    this.channelState.set(channel, { key, priority });

    if (expectedDurationMs && expectedDurationMs > 0) {
      const timer = setTimeout(
        () => this.clearChannel(channel),
        expectedDurationMs,
      );
      this.channelTimers.set(channel, timer);
    }

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
    for (const [channel, active] of this.channelState.entries()) {
      soundManager.fadeOutKey(active.key, 120);
      this.clearChannel(channel);
    }
  }
}

export const centralAudioManager = CentralAudioManager.getInstance();
