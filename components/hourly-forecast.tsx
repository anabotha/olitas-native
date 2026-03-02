import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HourlyForecast as HourlyForecastType } from "@/lib/types";
import { Clock } from "lucide-react";

interface HourlyForecastProps {
  forecast: HourlyForecastType[];
}

export function HourlyForecast({ forecast }: HourlyForecastProps) {
  if (!forecast.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          Upcoming hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
            {forecast.map((hour, i) => {
              const time = new Date(hour.time);
              const hourStr = time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

              return (
                <div
                  key={i}
                  className="flex min-w-[80px] flex-col items-center gap-2 rounded-xl bg-secondary/50 px-3 py-3"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {hourStr}
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-bold text-foreground">
                      {hour.waveHeight.toFixed(1)}
                      <span className="text-xs font-normal text-muted-foreground">
                        m
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hour.windSpeed.toFixed(0)} km/h
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hour.temperature.toFixed(0)}
                      {"\u00B0C"}
                    </span>
                  </div>
                  {hour.uvIndex > 0 && (
                    <span className="rounded-full bg-accent/50 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      UV {hour.uvIndex.toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
