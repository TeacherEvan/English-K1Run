export interface IntroPlaybackGateState {
  isLanguageShellVisible: boolean;
  shouldLoadVideo: boolean;
  shouldShowStatusPanel: boolean;
  showFallbackImage: boolean;
  shouldStartAudioWhenVideoPlays: boolean;
  readyToContinueAfterFailure: boolean;
}

const INITIAL_STATE: IntroPlaybackGateState = {
  isLanguageShellVisible: true,
  shouldLoadVideo: false,
  shouldShowStatusPanel: true,
  showFallbackImage: false,
  shouldStartAudioWhenVideoPlays: false,
  readyToContinueAfterFailure: false,
};

export const createIntroPlaybackGate = () => {
  let state = { ...INITIAL_STATE };
  let hasStartedAudio = false;

  return {
    getState: () => state,
    onLanguageSelected: () => {
      state = {
        ...state,
        isLanguageShellVisible: false,
        shouldLoadVideo: true,
        shouldShowStatusPanel: false,
        showFallbackImage: false,
        shouldStartAudioWhenVideoPlays: true,
        readyToContinueAfterFailure: false,
      };
    },
    onVideoPlaying: () => {
      if (!state.shouldStartAudioWhenVideoPlays || hasStartedAudio) {
        return false;
      }
      hasStartedAudio = true;
      return true;
    },
    onVideoError: () => {
      state = {
        ...state,
        shouldLoadVideo: false,
        shouldShowStatusPanel: false,
        showFallbackImage: true,
        shouldStartAudioWhenVideoPlays: false,
        readyToContinueAfterFailure: true,
      };
    },
    onReadyToContinue: () => {
      state = {
        ...state,
        shouldShowStatusPanel: true,
      };
    },
  };
};
