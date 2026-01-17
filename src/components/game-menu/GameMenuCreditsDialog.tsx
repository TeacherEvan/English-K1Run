import { memo } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { InfoIcon } from "./icons";

export const GameMenuCreditsDialog = memo(() => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="text-center mt-2">
                    <Button
                        variant="link"
                        size="sm"
                        className="text-muted-foreground/60 h-auto p-0 text-xs"
                        data-testid="credits-button"
                    >
                        Credits / เครดิต
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <InfoIcon className="w-6 h-6" />
                        Credits / เครดิต
                    </DialogTitle>
                </DialogHeader>
                <div className="py-8 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-widest">
                            Created By
                        </p>
                        <h3 className="text-2xl font-bold text-primary">TEACHER EVAN</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-widest">
                            In Association With
                        </p>
                        <h3 className="text-xl font-bold text-orange-500">
                            SANGSOM KINDERGARTEN
                        </h3>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm font-semibold mb-2">SPECIAL THANKS TO</p>
                        <p className="text-lg">TEACHER MIKE AND TEACHER LEE</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

GameMenuCreditsDialog.displayName = "GameMenuCreditsDialog";
