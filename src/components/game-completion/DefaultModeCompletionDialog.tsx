import { type CSSProperties, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { announceToScreenReader } from "../../lib/accessibility-utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface DefaultModeCompletionDialogProps {
  isVisible: boolean;
}

const AUTO_CLOSE_MS = 4000;

const PANEL_STYLE: CSSProperties = {
  background:
    "linear-gradient(155deg, color-mix(in oklch, var(--background) 82%, oklch(0.96 0.04 95)) 0%, color-mix(in oklch, var(--background) 85%, oklch(0.94 0.05 150)) 54%, color-mix(in oklch, var(--background) 89%, oklch(0.95 0.03 230)) 100%)",
  borderColor:
    "color-mix(in oklch, var(--border) 72%, oklch(0.84 0.09 95))",
  boxShadow:
    "inset 0 1px 0 color-mix(in oklch, white 88%, transparent), 0 28px 70px color-mix(in oklch, var(--foreground) 16%, transparent)",
};

const ACCENT_STYLE: CSSProperties = {
  background:
    "linear-gradient(90deg, color-mix(in oklch, var(--primary) 60%, oklch(0.84 0.13 150)) 0%, oklch(0.86 0.13 95) 52%, color-mix(in oklch, var(--primary) 65%, oklch(0.88 0.09 230)) 100%)",
};

const BADGE_STYLE: CSSProperties = {
  background:
    "color-mix(in oklch, var(--background) 44%, oklch(0.92 0.08 95))",
  borderColor:
    "color-mix(in oklch, var(--border) 74%, oklch(0.85 0.09 95))",
  color: "color-mix(in oklch, var(--foreground) 84%, oklch(0.58 0.1 95))",
};

const TITLE_STYLE: CSSProperties = {
  color: "color-mix(in oklch, var(--foreground) 92%, oklch(0.64 0.11 95))",
};

const DESCRIPTION_STYLE: CSSProperties = {
  color: "color-mix(in oklch, var(--foreground) 68%, oklch(0.62 0.06 150))",
};

const BUTTON_STYLE: CSSProperties = {
  background:
    "color-mix(in oklch, var(--primary) 72%, oklch(0.82 0.12 150))",
  boxShadow:
    "0 16px 34px color-mix(in oklch, var(--primary) 26%, transparent)",
};

export function DefaultModeCompletionDialog({
  isVisible,
}: DefaultModeCompletionDialogProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const open = isVisible && !dismissed;
  const dismissDialog = () => setDismissed(true);
  const completionAnnouncement = t("accessibility.completionDialogAnnouncement");

  useEffect(() => {
    if (!open) {
      return;
    }

    announceToScreenReader(completionAnnouncement, "assertive");
  }, [completionAnnouncement, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissed(true);
    }, AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          dismissDialog();
        }
      }}
    >
      <DialogContent
        data-testid="default-completion-dialog"
        className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-xl"
      >
        <div
          className="relative isolate overflow-hidden rounded-4xl border px-5 pb-5 pt-8 sm:px-7 sm:pb-7 sm:pt-9"
          style={PANEL_STYLE}
        >
          <div
            aria-hidden="true"
            className="animate-completion-countdown absolute inset-x-0 top-0 h-1.5 origin-left motion-reduce:animate-none"
            style={{
              ...ACCENT_STYLE,
              animationDuration: `${AUTO_CLOSE_MS}ms`,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 bottom-0 select-none text-[4.75rem] leading-none opacity-15 sm:text-[5.75rem]"
          >
            🐢
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-5 text-lg opacity-50"
          >
            ✦
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-16 top-7 text-sm opacity-40"
          >
            ✦
          </div>

          <DialogHeader className="relative items-start gap-4 pr-12 text-left">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em]"
              style={BADGE_STYLE}
            >
              <span aria-hidden="true">✦</span>
              <span>{t("messages.victoryTitle")}</span>
            </div>
            <DialogTitle
              className="max-w-[10ch] text-balance text-[clamp(2rem,4.5vw,3rem)] font-black leading-[0.95] tracking-[-0.05em]"
              style={TITLE_STYLE}
            >
              {t("messages.completionTitle")}
            </DialogTitle>
            <DialogDescription
              className="max-w-[26ch] text-pretty text-[clamp(1rem,2vw,1.15rem)] leading-relaxed"
              style={DESCRIPTION_STYLE}
            >
              {t("messages.completionDescription")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="relative mt-6 sm:justify-start">
            <Button
              data-testid="default-completion-dialog-button"
              size="lg"
              className="min-h-12 w-full rounded-full px-5 text-base font-semibold sm:w-auto"
              style={BUTTON_STYLE}
              onClick={dismissDialog}
              autoFocus
            >
              {t("messages.completionButton")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}