import { memo, useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { LogOutIcon } from "./icons";
import { MenuActionButtonContent } from "./MenuActionButtonContent";

interface GameMenuExitDialogProps {
    onResetGame?: () => void;
}

export const GameMenuExitDialog = memo(
    ({ onResetGame }: GameMenuExitDialogProps) => {
        const [showExitDialog, setShowExitDialog] = useState(false);

        const handleExit = () => {
            setShowExitDialog(true);
        };

        const confirmExit = () => {
            setShowExitDialog(false);
            onResetGame?.();
            try {
                window.close();
            } catch {
                console.log("[GameMenu] window.close() blocked by browser");
            }
        };

        return (
            <>
                <Button
                    variant="destructive"
                    size="lg"
                    className="h-14 text-lg font-semibold justify-start px-8 gap-4 mt-2 bg-red-700 hover:bg-red-800"
                    onClick={handleExit}
                    data-testid="exit-button"
                >
                    <MenuActionButtonContent
                        icon={<LogOutIcon className="w-5 h-5" />}
                        title="Exit"
                        subtitle="ออก"
                        subtitleClassName="text-xs font-semibold text-white font-thai mt-0.5"
                    />
                </Button>

                <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2 text-destructive">
                                <LogOutIcon className="w-6 h-6" />
                                Exit Game / ออกจากเกม
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to exit? / คุณแน่ใจหรือไม่ว่าต้องการออก?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-4 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowExitDialog(false)}
                                autoFocus
                            >
                                Cancel / ยกเลิก
                            </Button>
                            <Button variant="destructive" onClick={confirmExit}>
                                Exit / ออก
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
);

GameMenuExitDialog.displayName = "GameMenuExitDialog";
