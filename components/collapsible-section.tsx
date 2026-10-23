"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    /** Se muestra al lado del título, fuera del botón que colapsa (ej. un InfoTip) */
    info?: React.ReactNode;
}

export function CollapsibleSection({
    title,
    children,
    defaultOpen = true,
    info,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex w-full items-center gap-1.5">
                <CollapsibleTrigger asChild>
                    <button className="cursor-pointer">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            {title}
                        </h3>
                    </button>
                </CollapsibleTrigger>
                {info}
                <CollapsibleTrigger asChild>
                    <button className="flex flex-1 cursor-pointer justify-end self-stretch items-center" aria-label={isOpen ? "Colapsar" : "Expandir"}>
                        <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"
                                }`}
                        />
                    </button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-4 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
