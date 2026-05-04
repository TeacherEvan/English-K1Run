const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

interface AttemptIntroVideoPlayOptions {
  videoElement: HTMLVideoElement;
  onInterrupted: () => void;
  onError: () => void;
}

export const attemptIntroVideoPlay = ({
  videoElement,
  onInterrupted,
  onError,
}: AttemptIntroVideoPlayOptions) => {
  try {
    const playAttempt = videoElement.play();
    if (typeof playAttempt?.catch !== "function") {
      return;
    }
    void playAttempt.catch((error: unknown) => {
      if (isAbortError(error)) {
        onInterrupted();
        return;
      }
      onError();
    });
  } catch (error) {
    if (isAbortError(error)) {
      onInterrupted();
      return;
    }
    onError();
  }
};