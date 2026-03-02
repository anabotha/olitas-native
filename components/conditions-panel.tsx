import {
  Waves,
  Wind,
  Thermometer,
  Droplets,
  ArrowUp,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CombinedConditions } from "@/lib/types";
import {
  getWindDirectionLabel,
  getWeatherDescription,
} from "@/lib/conditions";

interface ConditionsPanelProps {
  conditions: CombinedConditions;
}

export function ConditionsPanel({ conditions }: ConditionsPanelProps) {
  const c = conditions.current;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Waves */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Waves className="h-4 w-4" />
            Waves
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {c.waveHeight.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">m</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ConditionItem label="Period" value={`${c.wavePeriod.toFixed(0)}s`} />
            <ConditionItem
              label="Direction"
              value={
                <span className="flex items-center gap-1">
                  <ArrowUp
                    className="h-3 w-3"
                    style={{ transform: `rotate(${c.waveDirection}deg)` }}
                  />
                  {c.waveDirection.toFixed(0)}
                </span>
              }
            />
            <ConditionItem label="Swell" value={`${c.swellHeight.toFixed(1)}m`} />
            <ConditionItem label="Swell Period" value={`${c.swellPeriod.toFixed(0)}s`} />
          </div>
        </CardContent>
      </Card>

      {/* Wind */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Wind className="h-4 w-4" />
            Wind
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {c.windSpeed.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">km/h</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ConditionItem
              label="Direction"
              value={getWindDirectionLabel(c.windDirection)}
            />
            <ConditionItem label="Gusts" value={`${c.windGusts.toFixed(0)} km/h`} />
          </div>
        </CardContent>
      </Card>

      {/* Temperature */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Thermometer className="h-4 w-4" />
            Temperature
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {c.airTemperature.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">{"\u00B0C"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ConditionItem
              label="Feels like"
              value={`${c.feelsLike.toFixed(0)}\u00B0C`}
            />
            <ConditionItem
              label="Sea temp"
              value={
                c.seaTemperature > 0 ? (
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-primary" />
                    {c.seaTemperature.toFixed(0)}
                    {"\u00B0C"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )
              }
            />
            <ConditionItem
              label="Weather"
              value={
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {getWeatherDescription(c.weatherCode)}
                </span>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConditionItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
