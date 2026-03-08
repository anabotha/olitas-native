"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ActivityRating } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { KayakIcon, SwimmingIcon, SurfboardIcon } from "@hugeicons/core-free-icons";

interface ActivityCardProps {
  activity: string;
  icon: React.ReactNode;
  rating: ActivityRating;
}
const getScoreColor = (score: number): string => {
  if (score <= 1) return "bg-red-100 text-red-700 border-red-200";
  if (score <= 5) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (score <= 7) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score <= 9) return "bg-teal-100 text-teal-700 border-teal-200";
  return "bg-cyan-100 text-cyan-700 border-cyan-200";
};
const getScoreDot = (score: number): string => {
  if (score <= 1) return "bg-red-500";
  if (score <= 5) return "bg-yellow-500";
  if (score <= 7) return "bg-emerald-500";
  if (score <= 9) return "bg-teal-500";
  return "bg-cyan-500";
};
export function getScoreBg(score: number) {
  if (score <= 1) return "bg-red-50 dark:bg-red-950/30";
  if (score <= 5) return "bg-yellow-50 dark:bg-yellow-950/30";
  if (score <= 7) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (score <= 9) return "bg-teal-50 dark:bg-teal-950/30";
  return "bg-cyan-50 dark:bg-cyan-950/30";
}
export function getScoreTextColor(score: number) {
  if (score <= 1) return "text-red-700 dark:text-red-400";
  if (score <= 5) return "text-yellow-700 dark:text-yellow-400";
  if (score <= 7) return "text-emerald-700 dark:text-emerald-400";
  if (score <= 9) return "text-teal-700 dark:text-teal-400";
  return "text-cyan-700 dark:text-cyan-400";
}
export function getScoreSegmentColor(score: number) {
  if (score <= 1) return "bg-red-400";
  if (score <= 5) return "bg-yellow-400";
  if (score <= 7) return "bg-emerald-500";
  if (score <= 9) return "bg-teal-500";
  return "bg-cyan-500";
}
export function getScoreRing(score: number) {
  if (score <= 1) return "ring-red-200 dark:ring-red-800";
  if (score <= 5) return "ring-yellow-200 dark:ring-yellow-800";
  if (score <= 7) return "ring-emerald-200 dark:ring-emerald-800";
  if (score <= 9) return "ring-teal-200 dark:ring-teal-800";
  return "ring-cyan-200 dark:ring-cyan-800";
}
export function ActivityCard({
  activity,
  icon,
  rating,
}: ActivityCardProps) {
  let label = rating.label;
  if (rating.label === "Tranqui") {
    if (activity === "Nado en aguas abiertas") label = "Nadable";
    if (activity === "SUP") label = "Remable";
    if (activity === "Surf") label = "Tranqui";
  }

  const scoreSegments = 5;
  const filledSegments = Math.max(1, Math.ceil((rating.score / 10) * scoreSegments));

  return (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-border overflow-hidden">
      {/* Status banner — protagonista visual */}
      {/* <div className={cn("flex items-center justify-between px-4 py-3", getScoreBg(rating.score))}>
        <div className="flex items-center gap-2">
          <span className={cn("text-base font-bold", getScoreTextColor(rating.score))}>
            {label}
          </span>
        </div>
        <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-offset-1", getScoreDot(rating.score), getScoreRing(rating.score))} />
      </div> */}

      <CardContent className="flex flex-col gap-4 p-5">
        {/* Activity identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{activity}</h3>
            <p className="text-sm text-muted-foreground">
              {rating.description}
              {activity === "Nado en aguas abiertas" && rating.score === 4 && (
                <span> apto para avanzados</span>
              )}
            </p>
          </div>
        </div>

        {/* Score bar — convención clara */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Condición general
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: scoreSegments }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < filledSegments ? getScoreSegmentColor(rating.score) : "bg-muted"
                )}
              />
            ))}
            <span className="ml-1 text-[11px] text-muted-foreground">
              {filledSegments}/{scoreSegments}
            </span>
          </div>
        </div>

        {/* Tags — detalle secundario */}
        {rating?.factors?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rating.factors.map((factor, i) => (
              <span
                key={i}
                className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {factor}
              </span>
            ))}
          </div>
        )}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 mt-auto",
            getScoreBg(rating.score)
          )}
        >
          <div className="flex items-center justify-center gap-2 ">
            <span className={cn("text-sm font-bold rounded-b-xl", getScoreTextColor(rating.score))}>
              {label}
            </span>
          </div>
          <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-offset-1", getScoreDot(rating.score), getScoreRing(rating.score))} />
        </div>
      </CardContent>
    </Card>
  );
}