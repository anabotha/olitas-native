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
}

export function CollapsibleSection({
    title,
    children,
    defaultOpen = true,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between group cursor-pointer">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {title}
                    </h3>
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"
                            }`}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
