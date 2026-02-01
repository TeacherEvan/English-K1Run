import { memo } from "react";

interface TargetAnnouncementOverlayProps {
  emoji: string;
  sentence: string;
  isVisible: boolean;
}

export const TargetAnnouncementOverlay = memo(
  ({ emoji, sentence, isVisible }: TargetAnnouncementOverlayProps) => {
    if (!isVisible) return null;

    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
        aria-live="polite"
        role="status"
        data-testid="target-announcement"
      >
        <div
          className="bg-white/90 rounded-2xl shadow-2xl px-6 py-4 text-center backdrop-blur-md"
          style={{
            maxWidth: "80vw",
          }}
        >
          <div
            className="mb-2"
            style={{
              fontSize: "calc(4rem * var(--object-scale, 1))",
              lineHeight: 1,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
            }}
          >
            {emoji}
          </div>
          <div
            className="font-semibold text-blue-900"
            style={{
              fontSize: "calc(1.1rem * var(--font-scale, 1))",
            }}
          >
            {sentence}
          </div>
        </div>
      </div>
    );
  },
);

TargetAnnouncementOverlay.displayName = "TargetAnnouncementOverlay";