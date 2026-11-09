"use client";

import { MapPin, ChevronDown, Search } from "lucide-react";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface SpotSelectorProps {
  selectedSpot: SpotLocation;
  onSelectSpot: (spot: SpotLocation) => void;
  variant?: string;
}

export function SpotSelector({ selectedSpot, onSelectSpot }: SpotSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filteredSpots = DEFAULT_SPOTS.filter(
    (spot) =>
      spot.name.toLowerCase().includes(search.toLowerCase()) ||
      (spot.country?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary"
      >
        <MapPin className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {selectedSpot.name}
          </span>
          {selectedSpot.country && (
            <span className="text-xs text-muted-foreground">
              {selectedSpot.country}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Busca tu lugar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredSpots.map((spot) => (
              <button
                key={spot.name}
                onClick={() => {
                  localStorage.setItem("olitas_selected_spot", JSON.stringify(spot));
                  if (spot.name !== selectedSpot.name) {
                    track("spot_seleccionado", { spot: spot.name });
                  }
                  onSelectSpot(spot);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary",
                  selectedSpot.name === spot.name && "bg-secondary"
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {spot.name}
                  </span>
                  {spot.country && (
                    <span className="text-xs text-muted-foreground">
                      {spot.country}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {filteredSpots.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No spots found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
