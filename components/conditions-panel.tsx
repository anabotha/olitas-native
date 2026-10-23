import {
  Waves,
  ArrowUp,
  Eye,
  Sun,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import {

  getWeatherDescription,
} from "@/lib/conditions";
import { HugeiconsIcon } from '@hugeicons/react'
import { FastWindIcon, ThermometerWarmIcon } from '@hugeicons/core-free-icons'
import { useProcessForecast, inicioDeHora } from "@/hooks/use-proccessForecast";
import { processData } from '@/hooks/use-processData';

interface ConditionsProps {
  forecast: ForecastData | undefined;
  conditions: MarineWeatherData;
  selectedSpot: SpotLocation | undefined;
  selectedHour: Date | undefined;
}

export function ConditionsPanel({ forecast, conditions, selectedSpot, selectedHour }: ConditionsProps) {
  const result = useProcessForecast(forecast);
  if (!forecast?.hourly) return null;
  if (!conditions) return null;
  if (!result) return null;
  const { hoy, semana, mañana } = result;
  const processedData = processData(conditions, forecast, selectedSpot?.orientation, selectedSpot?.name, selectedHour);
  if (!processedData) return <div>Hubo un error, proba mas tarde!</div>;

const degToCompass = (deg: number) => {
    const directions = ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"];
    const index = Math.floor(((deg + 22.5) / 45)) % 8;
    return directions[index];
};



  const getHoyIndex = (forecast: ForecastData): number => {
    const ahora = new Date();
    return forecast.daily.time.findIndex((t) => {
      const d = new Date(t);
      return (
        d.getFullYear() === ahora.getFullYear() &&
        d.getMonth() === ahora.getMonth() &&
        d.getDate() === ahora.getDate()
      );
    });
  };
  // Buscamos la hora seleccionada por fecha completa, no solo por número de hora
  const objetivo = inicioDeHora(selectedHour ?? new Date());
  const ordenado = [...hoy, ...mañana].filter((hour) => inicioDeHora(hour.time) === objetivo);
  if (ordenado.length === 0) return null;
  const hoyIndex = getHoyIndex(forecast!);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Waves */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Waves className="h-6 w-6" />
            Olitas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {processedData.current.waveHeight?.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">m</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ConditionItem label="Periodo" value={`${processedData.current.wavePeriod?.toFixed(1)}s`} />
            <ConditionItem
              label="Direccion de las olas"
              value={
                <span className="flex items-center gap-1">
                  <ArrowUp
                    className="h-3 w-3"
                    style={{ transform: `rotate(${((processedData.current.waveDirection ?? 0) + 180) % 360}deg)` }}
                  />
                  {processedData.current.waveDirection != null
                    ? degToCompass(processedData.current.waveDirection)
                    : "—"}
                </span>
              }
            />
            <ConditionItem label="Swell" value={`${processedData.current.swellHeight?.toFixed(1)}m`} />
            {processedData.current.swellPeriod != null && !isNaN(processedData.current.swellPeriod) && (
              <ConditionItem
                label="Swell Period"
                value={`${processedData.current.swellPeriod.toFixed(0)}s`}
              />
            )}
            {processedData.current.swellDirection != null && !isNaN(processedData.current.swellDirection) && (
              <ConditionItem
                label="Direccion del swell"
                value={
                  <span className="flex items-center gap-1">
                    <ArrowUp
                      className="h-3 w-3"
                      style={{ transform: `rotate(${(processedData.current.swellDirection + 180) % 360}deg)` }}
                    />
                    {degToCompass(processedData.current.swellDirection)}
                  </span>
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wind */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HugeiconsIcon icon={FastWindIcon} />
            Viento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {ordenado[0].wind_speed_10m.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">km/h</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ConditionItem
              label="Direccion"
              value={degToCompass(ordenado[0].wind_direction_10m)}
            />
            <ConditionItem 
  label="Racha" 
  value={ordenado[0].wind_gusts_10m != null 
    ? `${ordenado[0].wind_gusts_10m.toFixed(0)} km/h` 
    : "—"
  } 
/>
          </div>
        </CardContent>
      </Card>

      {/* Temperature */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HugeiconsIcon icon={ThermometerWarmIcon} />
            Temperatura
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {ordenado[0].temperatura_2m.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">{"\u00B0C"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ConditionItem
              label="Sensacion termica"
              value={`${ordenado[0].apparent_temperature.toFixed(0)}\u00B0C`}
            />
            <ConditionItem
              label="UV"
              value={
                forecast?.daily.uv_index_max[hoyIndex] > 0 ? (
                  <span className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-primary" />
                    {forecast?.daily.uv_index_max[hoyIndex].toFixed(0)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )
              }
            />
            {
              ordenado[0].weatherCode && (
                <ConditionItem
                  label="Weather"
                  value={
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {getWeatherDescription(ordenado[0].weatherCode)}
                    </span>
                  }
                />
              )
            }
          </div>
        </CardContent>
      </Card>
    </div >
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
