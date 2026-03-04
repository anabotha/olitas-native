"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ActivityRating } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  activity: string;
  icon: React.ReactNode;
  rating: ActivityRating;
  isSelected: boolean;
  onClick: () => void;
}

const scoreColors: Record<number, string> = {
  1: "bg-red-100 text-red-700 border-red-200",
  2: "bg-orange-100 text-orange-700 border-orange-200",
  3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  4: "bg-emerald-100 text-emerald-700 border-emerald-200",
  5: "bg-teal-100 text-teal-700 border-teal-200",
};

const scoreDots: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-emerald-500",
  5: "bg-teal-500",
};

export function ActivityCard({
  activity,
  icon,
  rating,
  isSelected,
  onClick,
}: ActivityCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected
          ? "ring-2 ring-primary shadow-md"
          : "hover:ring-1 hover:ring-border"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {activity}
              </h3>
              <p className="text-xs text-muted-foreground">
                {rating.description}
                {activity === "swimming" && rating.score == 3 ? (
                  <span> apto para avanzados</span>
                ) : (<></>)}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              scoreColors[rating.score]
            )}
          >
            <span
              className={cn("h-2 w-2 rounded-full", scoreDots[rating.score])}
            />

            {rating.label}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">

          {rating?.factors?.map((factor, i) => (
            <span
              key={i}
              className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {factor}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
