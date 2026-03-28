import { useEffect, useState } from "react";
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

export function DefaultModeCompletionDialog({
  isVisible,
}: DefaultModeCompletionDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setOpen(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!open) {
      return;
    }

    announceToScreenReader(
      t("accessibility.completionDialogAnnouncement"),
      "assertive",
    );

    const timeoutId = window.setTimeout(() => {
      setOpen(false);
    }, AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open, t]);

  if (!isVisible && !open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        data-testid="default-completion-dialog"
        className="sm:max-w-md border-border/80 bg-background/98 shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("messages.completionTitle")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("messages.completionDescription")}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-end">
          <Button
            data-testid="default-completion-dialog-button"
            onClick={() => setOpen(false)}
            autoFocus
          >
            {t("messages.completionButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}