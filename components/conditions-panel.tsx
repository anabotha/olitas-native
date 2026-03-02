import {
  Waves,
  Wind,
  Thermometer,
  Droplets,
  ArrowUp,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CombinedConditions, ForecastData, MarineWeatherData } from "@/lib/types";
import {
  getWindDirectionLabel,
  getWeatherDescription,
} from "@/lib/conditions";
import { useProcessForecast } from "@/hooks/use-proccessForecast";
import { processData } from '@/hooks/use-processData';

interface ConditionsProps {
  forecast: ForecastData | undefined;
  conditions: MarineWeatherData;
}

export function ConditionsPanel({ forecast, conditions }: ConditionsProps) {
  if (!forecast?.hourly) return null;
  if (!conditions) return null;

  const { hoy } = useProcessForecast(forecast);
  const processedData = processData(conditions);
  if (!processedData) return <div>Hubo un error, proba mas tarde!</div>;

  const degToCompass = (deg: number) => {
    const directions = ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const ordenarHora = (hoy: any) => {
    const ahora = new Date().getHours();
    const ordenado = hoy
      .sort((a, b) => {
        const ha = parseInt(a.hora.split(":")[0], 10);
        const hb = parseInt(b.hora.split(":")[0], 10);
        return ha - hb;
      })
      .filter(hour => {
        const hNum = parseInt(hour.hora.split(":")[0], 10);
        return hNum == ahora;
      });
    return ordenado;
  };
  const ordenado = ordenarHora(hoy);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Waves */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Waves className="h-4 w-4" />
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
                    style={{ transform: `rotate(${processedData.current.waveDirection}deg)` }}
                  />
                  {processedData.current.waveDirection?.toFixed(0)}
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
                      style={{ transform: `rotate(${processedData.current.swellDirection}deg)` }}
                    />
                    {processedData.current.swellDirection?.toFixed(0)}
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
            <Wind className="h-4 w-4" />
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
            <ConditionItem label="Racha" value={`${ordenado[0].wind_speed_10m.toFixed(0)} km/h`} />
          </div>
        </CardContent>
      </Card>

      {/* Temperature */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Thermometer className="h-4 w-4" />
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
            />{/* 
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
            />*/}
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
