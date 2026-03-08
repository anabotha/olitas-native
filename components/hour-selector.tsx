"use client";

import { MapPin, ChevronDown, Search } from "lucide-react";
import type { SpotLocation } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";



type HourSelectorProps = {
    selectedHour: Date;
    onSelectHour: (hour: Date) => void;
    variant?: "default" | "inline";
};

export function HourSelector({ selectedHour, onSelectHour, variant = "default" }: HourSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getHours = () => {
        const entries: { date: Date; label: string }[] = [];
        const now = new Date();
        const currentHour = now.getHours();

        // Hoy: desde la hora actual hasta las 23
        for (let i = currentHour; i < 24; i++) {
            const d = new Date(now);
            d.setHours(i, 0, 0, 0);
            entries.push({ date: d, label: `hoy ${i}:00` });
        }
        // Mañana: desde 0 hasta la hora actual
        for (let i = 0; i < currentHour; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + 1);
            d.setHours(i, 0, 0, 0);
            entries.push({ date: d, label: `mañana ${i}:00` });
        }
        return entries;
    };

    const hours = getHours();
    const selectedLabel = hours.find(h => h.date.getTime() === selectedHour.getTime())?.label ?? `${selectedHour.getHours()}:00`;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "transition-colors",
                    variant === "inline"
                        ? "inline-flex items-center gap-1 rounded-lg underline decoration-dotted decoration-primary/50 underline-offset-4 hover:text-primary"
                        : "flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 hover:bg-secondary"
                )}
            >
                {variant === "inline" ? (
                    <>
                        <span>{selectedLabel}</span>
                        <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", isOpen && "rotate-180")} />
                    </>
                ) : (
                    <>
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{selectedLabel}</span>
                        <ChevronDown className={cn("ml-2 h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-40 rounded-xl border border-border bg-card shadow-lg">
                    <div className="max-h-64 overflow-y-auto p-1">
                        {hours.map((entry) => (
                            <button
                                key={entry.date.getTime()}
                                onClick={() => {
                                    onSelectHour(entry.date);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                                    selectedHour.getTime() === entry.date.getTime() && "bg-secondary font-semibold"
                                )}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
