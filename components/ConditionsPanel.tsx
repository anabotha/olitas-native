import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ArrowUp, Eye, Sun, Thermometer, Waves, Wind } from "lucide-react-native";
import type { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import { getWeatherDescription } from "@/lib/conditions";
import { useProcessForecast, inicioDeHora } from "@/hooks/use-proccessForecast";
import { processData } from "@/hooks/use-processData";
import { useTheme } from "@/lib/theme";
import { Card } from "./ui";

interface ConditionsProps {
  forecast: ForecastData | undefined;
  conditions: MarineWeatherData;
  selectedSpot: SpotLocation | undefined;
  selectedHour: Date | undefined;
}

const degToCompass = (deg: number) => {
  const directions = ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"];
  const index = Math.floor((deg + 22.5) / 45) % 8;
  return directions[index];
};

const getHoyIndex = (forecast: ForecastData): number => {
  const ahora = new Date();
  return forecast.daily.time.findIndex(t => {
    const d = new Date(t);
    return (
      d.getFullYear() === ahora.getFullYear() &&
      d.getMonth() === ahora.getMonth() &&
      d.getDate() === ahora.getDate()
    );
  });
};

export function ConditionsPanel({ forecast, conditions, selectedSpot, selectedHour }: ConditionsProps) {
  const c = useTheme();
  const result = useProcessForecast(forecast);
  if (!forecast?.hourly || !conditions || !result) return null;

  const { hoy, mañana } = result;
  const processedData = processData(conditions, forecast, selectedSpot?.orientation, selectedSpot?.name, selectedHour);
  if (!processedData) return <Text style={{ color: c.foreground }}>Hubo un error, proba mas tarde!</Text>;

  // Buscamos la hora seleccionada por fecha completa, no solo por número de hora
  const objetivo = inicioDeHora(selectedHour ?? new Date());
  const ordenado = [...hoy, ...mañana].filter(hour => inicioDeHora(hour.time) === objetivo);
  if (ordenado.length === 0) return null;

  const hour = ordenado[0];
  const current = processedData.current;
  const hoyIndex = getHoyIndex(forecast);
  const uv = forecast.daily.uv_index_max[hoyIndex];

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Title icon={<Waves size={22} color={c.mutedForeground} />}>Olitas</Title>
        <Big value={current.waveHeight?.toFixed(2)} unit="m" />
        <View style={styles.grid}>
          <Item label="Periodo" value={`${current.wavePeriod?.toFixed(1)}s`} />
          <Item
            label="Direccion de las olas"
            value={
              <Direction deg={current.waveDirection} text={current.waveDirection != null ? degToCompass(current.waveDirection) : "—"} />
            }
          />
          <Item label="Swell" value={`${current.swellHeight?.toFixed(1)}m`} />
          {current.swellPeriod != null && !isNaN(current.swellPeriod) && (
            <Item label="Swell Period" value={`${current.swellPeriod.toFixed(0)}s`} />
          )}
          {current.swellDirection != null && !isNaN(current.swellDirection) && (
            <Item
              label="Direccion del swell"
              value={<Direction deg={current.swellDirection} text={degToCompass(current.swellDirection)} />}
            />
          )}
        </View>
      </Card>

      <Card>
        <Title icon={<Wind size={22} color={c.mutedForeground} />}>Viento</Title>
        <Big value={hour.wind_speed_10m.toFixed(0)} unit="km/h" />
        <View style={styles.grid}>
          <Item label="Direccion" value={degToCompass(hour.wind_direction_10m)} />
          <Item label="Racha" value={hour.wind_gusts_10m != null ? `${hour.wind_gusts_10m.toFixed(0)} km/h` : "—"} />
        </View>
      </Card>

      <Card>
        <Title icon={<Thermometer size={22} color={c.mutedForeground} />}>Temperatura</Title>
        <Big value={hour.temperatura_2m.toFixed(0)} unit={"°C"} />
        <View style={styles.grid}>
          <Item label="Sensacion termica" value={`${hour.apparent_temperature.toFixed(0)}°C`} />
          <Item
            label="UV"
            value={
              uv > 0 ? (
                <View style={styles.inline}>
                  <Sun size={12} color={c.primary} />
                  <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>{uv.toFixed(0)}</Text>
                </View>
              ) : (
                <Text style={{ color: c.mutedForeground, fontSize: 14 }}>N/A</Text>
              )
            }
          />
          {hour.weatherCode != null && (
            <Item
              label="Clima"
              wide
              value={
                <View style={styles.inline}>
                  <Eye size={12} color={c.foreground} />
                  <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>
                    {getWeatherDescription(hour.weatherCode)}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Card>
    </View>
  );
}

function Title({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={styles.inline}>
      {icon}
      <Text style={{ color: c.mutedForeground, fontSize: 14, fontWeight: "500" }}>{children}</Text>
    </View>
  );
}

function Big({ value, unit }: { value?: string; unit: string }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
      <Text style={{ color: c.foreground, fontSize: 30, fontWeight: "700" }}>{value}</Text>
      <Text style={{ color: c.mutedForeground, fontSize: 14 }}>{unit}</Text>
    </View>
  );
}

function Direction({ deg, text }: { deg: number | undefined; text: string }) {
  const c = useTheme();
  return (
    <View style={styles.inline}>
      <ArrowUp size={12} color={c.foreground} style={{ transform: [{ rotate: `${((deg ?? 0) + 180) % 360}deg` }] }} />
      <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>{text}</Text>
    </View>
  );
}

function Item({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  const c = useTheme();
  return (
    <View style={[styles.item, wide && { width: "100%" }]}>
      <Text style={{ color: c.mutedForeground, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</Text>
      {typeof value === "string" ? (
        <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 12 },
  item: { width: "50%", gap: 2, paddingRight: 8 },
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },
});
