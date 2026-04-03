import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ForecastData, HourlyForecast as HourlyForecastType } from "@/lib/types";
import { Clock } from "lucide-react";
import { useProcessForecast } from "@/hooks/use-proccessForecast";


import { HourlySummary } from "@/hooks/use-proccessForecast";

interface HourlyForecastProps {
  forecast: ForecastData | undefined;
  selectedHour?: Date | undefined;
}

export function HourlyForecast({ forecast, selectedHour }: HourlyForecastProps) {
  if (!forecast?.hourly) return null;

  const processed = useProcessForecast(forecast);
  if (!processed) return null;

  const { hoy, mañana, semana } = processed;
  const degToCompass = (deg: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const ordenarHora = (hoy: HourlySummary[]) => {
    const ahora = selectedHour ? selectedHour.getHours() : new Date().getHours();
    const ordenado = hoy
      .sort((a: any, b: any) => {
        const ha = parseInt(a.hora.split(":")[0], 10);
        const hb = parseInt(b.hora.split(":")[0], 10);
        return ha - hb;
      })
      .filter((hour: any) => {
        const hNum = parseInt(hour.hora.split(":")[0], 10);
        return hNum >= ahora;
      });
    return ordenado;
  };
  const ordenarMañana = (hoy: HourlySummary[]) => {
    const ahora = new Date().getHours();
    const ordenado = hoy
      .sort((a: any, b: any) => {
        const ha = parseInt(a.hora.split(":")[0], 10);
        const hb = parseInt(b.hora.split(":")[0], 10);
        return ha - hb;
      })
    return ordenado;
  };

  const ordenado = ordenarHora(hoy);
  console.log(ordenado, "ordenado")
  const mañanaOrdenado = ordenarMañana(mañana);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          Proximas horas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
            {ordenado?.map((hour, i) => {
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
                    {hour.hora}
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-bold text-foreground">

                      {/* <span className="text-xs font-normal text-muted-foreground">
                        m
                      </span> */}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Temperatura:
                      {hour.temperatura_2m.toFixed(0)}     {"\u00B0C"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Velocidad del viento:
                      {hour.wind_speed_10m.toFixed(0)}
                      km/h
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Direccion del viento:
                      {degToCompass(hour.wind_direction_10m)}
                    </span>
                  </div>
                  {semana[0].uvIndex > 0 && (
                    <span className="rounded-full bg-accent/50 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      UV {semana[0].uvIndex.toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}
            {mañanaOrdenado?.map((hour, i) => {


              return (
                <div
                  key={i}
                  className="flex min-w-[80px] flex-col items-center gap-2 rounded-xl bg-secondary/50 px-3 py-3"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {hour.hora}
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-bold text-foreground">

                      {/* <span className="text-xs font-normal text-muted-foreground">
                        m
                      </span> */}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Temperatura:
                      {hour.temperatura_2m.toFixed(0)}     {"\u00B0C"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Velocidad del viento:
                      {hour.wind_speed_10m.toFixed(0)}
                      km/h
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Direccion del viento:
                      {degToCompass(hour.wind_direction_10m)}
                    </span>
                  </div>
                  {semana[0].uvIndex > 0 && (
                    <span className="rounded-full bg-accent/50 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      UV {semana[0].uvIndex.toFixed(0)}
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
