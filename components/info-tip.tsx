"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoTipProps {
    /** Texto simple, o `children` para contenido con formato */
    text?: string;
    children?: React.ReactNode;
    label?: string;
}

// Ícono "i" con tooltip: hover en desktop, tap en mobile (Radix no abre tooltips con touch)
export function InfoTip({ text, children, label = "Más información" }: InfoTipProps) {
    const [open, setOpen] = useState(false);

    return (
        <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    onClick={() => setOpen(o => !o)}
                    className="inline-flex rounded-full text-muted-foreground transition-colors hover:text-primary"
                >
                    <Info className="h-3.5 w-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent className={children ? "max-w-80" : "max-w-56 text-center"}>{children ?? text}</TooltipContent>
        </Tooltip>
    );
}
