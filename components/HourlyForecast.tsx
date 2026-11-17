import { useCompact } from "@/lib/use-compact";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowUp, Clock, ThermometerSun, Wind } from "lucide-react-native";
import type { ForecastData } from "@/lib/types";
import { HourlySummary, inicioDeHora, useProcessForecast } from "@/hooks/use-proccessForecast";
import { useTheme } from "@/lib/theme";
import { Card, CardHeading } from "./ui";

const degToCompass = (deg: number) => {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return directions[Math.round(deg / 45) % 8];
};

function HourCell({ hour, uv, highlighted }: { hour: HourlySummary; uv: number; highlighted?: boolean }) {
  const c = useTheme();
  const muted = { color: c.mutedForeground, fontSize: 13 };
  return (
    <View
      style={[
        styles.cell,
        highlighted
          ? { borderColor: c.highlightBorder, backgroundColor: c.highlight }
          : { borderColor: c.border, backgroundColor: c.background },
      ]}
    >
      <Text style={{ color: c.mutedForeground, fontSize: 15, fontWeight: "500" }}>{hour.hora}</Text>
      <View style={styles.inline}>
        <ThermometerSun size={16} color={c.mutedForeground} />
        <Text style={muted}>{hour.temperatura_2m.toFixed(0)}°C</Text>
      </View>
      <View style={styles.inline}>
        <Wind size={16} color={c.mutedForeground} />
        <Text style={muted}>{hour.wind_speed_10m.toFixed(0)} km/h</Text>
      </View>
      <View style={styles.inline}>
        <ArrowUp size={16} color={c.mutedForeground} style={{ transform: [{ rotate: `${hour.wind_direction_10m}deg` }] }} />
        <Text style={muted}>{degToCompass(hour.wind_direction_10m)}</Text>
      </View>
      {uv > 0 && (
        <Text style={[styles.uv, { backgroundColor: c.accent + "80", color: c.foreground }]}>UV {uv.toFixed(0)}</Text>
      )}
    </View>
  );
}

export function HourlyForecast({ forecast, selectedHour }: { forecast: ForecastData | undefined; selectedHour?: Date }) {
  const compact = useCompact();
  const c = useTheme();
  const processed = useProcessForecast(forecast);
  if (!forecast?.hourly || !processed) return null;

  const { hoy, mañana, semana } = processed;
  const uv = semana[0].uvIndex;

  // Mostramos desde la hora seleccionada (fecha completa) en adelante
  const desde = inicioDeHora(selectedHour ?? new Date());
  const desdeSeleccion = (horas: HourlySummary[]) => horas.filter(hour => inicioDeHora(hour.time) >= desde);
  const hoyOrdenado = desdeSeleccion(hoy);
  const mañanaOrdenado = desdeSeleccion(mañana);

  return (
    <Card>
      <CardHeading
        icon={<Clock size={20} color={c.secondaryForeground} />}
        title="Próximas horas"
        subtitle={compact ? undefined : "Temperatura, viento y UV hora a hora"}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {hoyOrdenado.map((hour, i) => (
          <HourCell key={`hoy-${i}`} hour={hour} uv={uv} highlighted={i === 0} />
        ))}
        {mañanaOrdenado.length > 0 && (
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: c.border }]} />
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Mañana</Text>
            <View style={[styles.line, { backgroundColor: c.border }]} />
          </View>
        )}
        {mañanaOrdenado.map((hour, i) => (
          <HourCell key={`man-${i}`} hour={hour} uv={uv} />
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, paddingBottom: 8 },
  cell: { minWidth: 88, alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12 },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  uv: { fontSize: 12, fontWeight: "500", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  divider: { alignItems: "center", gap: 4 },
  line: { width: 1, flex: 1, minHeight: 40 },
});
