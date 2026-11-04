import { StyleSheet, Text, View } from "react-native";
import { ArrowDown, ArrowUp, Clock, Droplets, Ship, Waves } from "lucide-react-native";
import { processData } from "@/hooks/use-processData";
import { useRatings } from "@/hooks/use-ratings";
import type { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import { getScoreStyle, useIsDark, useTheme } from "@/lib/theme";
import { Card, CardHeading, Label } from "./ui";
import { InfoTip } from "./InfoTip";

// "Hoy 14:00" / "Mañana 7:00" / "Sáb 9:00"
const formatWindowTime = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const hour = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (diffDays === 0) return `Hoy ${hour}`;
  if (diffDays === 1) return `Mañana ${hour}`;
  const weekday = date.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${hour}`;
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// "Hoy 14–17 h" / "Hoy 22:00 – Mañana 1:00" / "Hoy 14:00" si es una sola hora
const formatWindowRange = (start: Date, end: Date) => {
  if (start.getTime() === end.getTime()) return formatWindowTime(start);
  if (isSameDay(start, end)) {
    const day = formatWindowTime(start).split(" ")[0];
    return `${day} ${start.getHours()}–${end.getHours()} h`;
  }
  return `${formatWindowTime(start)} – ${formatWindowTime(end)}`;
};

// Solo se muestran ventanas con puntaje > 5
const getWindowLabel = (score: number) => {
  if (score <= 6) return "Bien";
  if (score <= 8) return "Muy bueno";
  return "Excelente";
};

// Primera hora desde `from` en la que el nivel del mar cambia de tendencia (pleamar o bajamar)
const getNextTideTurn = (data: MarineWeatherData, from: Date) => {
  const times = data.hourly.time;
  const levels = data.hourly.sea_level_height_msl;
  if (!levels) return null;
  const start = times.findIndex(t => new Date(t).getTime() >= from.getTime());
  if (start < 1) return null;
  for (let i = start; i < levels.length - 1; i++) {
    const prev = levels[i - 1], curr = levels[i], next = levels[i + 1];
    if (prev == null || curr == null || next == null) continue;
    if (curr >= prev && curr > next) return { type: "Pleamar", date: new Date(times[i]) };
    if (curr <= prev && curr < next) return { type: "Bajamar", date: new Date(times[i]) };
  }
  return null;
};

interface SeaStateProps {
  data: MarineWeatherData;
  forecast: ForecastData | undefined;
  beach: SpotLocation;
  selectedHour: Date | undefined;
}

export function SeaState(props: SeaStateProps) {
  const { data, forecast, beach, selectedHour } = props;
  const processedData = processData(data, forecast, beach.orientation, beach.name, selectedHour);
  if (!processedData) return null;
  return <SeaStateContent {...props} processedData={processedData} />;
}

function SeaStateContent({
  data,
  forecast,
  beach,
  selectedHour,
  processedData,
}: SeaStateProps & { processedData: NonNullable<ReturnType<typeof processData>> }) {
  const c = useTheme();
  const dark = useIsDark();
  const ratings = useRatings(processedData, beach.name, beach.orientation ?? 90, beach, data, forecast, selectedHour);
  const bestWindows = ratings.bestWindows;
  const { seaState } = processedData;
  if (!seaState || !bestWindows) return null;

  const nextTide = getNextTideTurn(data, selectedHour ?? new Date());
  const TideArrow = seaState.isRising ? ArrowUp : ArrowDown;

  const iconProps = { size: 20, color: c.primary };
  const activities = [
    { label: "Surf", data: bestWindows.surf, icon: <Waves {...iconProps} /> },
    { label: "SUP", data: bestWindows.sup, icon: <Ship {...iconProps} /> },
    { label: "Natación", data: bestWindows.swimming, icon: <Droplets {...iconProps} /> },
  ];
  const validWindows = activities
    .filter(a => a.data.date && a.data.score > 5 && a.data.date >= new Date())
    .sort((a, b) => (a.data.start ?? a.data.date!).getTime() - (b.data.start ?? b.data.date!).getTime());

  // Chip suave por condición, reutilizando la escala de colores de las actividades
  const chip =
    seaState.condition === "Planchado"
      ? { bg: getScoreStyle(8, dark).bg, text: getScoreStyle(8, dark).text }
      : seaState.condition === "Picado"
        ? { bg: getScoreStyle(4, dark).bg, text: getScoreStyle(4, dark).text }
        : { bg: c.highlight, text: c.primary };

  return (
    <Card>
      <View style={{ gap: 16 }}>
        <CardHeading icon={<Waves size={20} color={c.secondaryForeground} />} title="Mar y marea" subtitle="Cómo está el agua ahora" />
        <View style={{ gap: 6 }}>
          <Label>Condición</Label>
          <Text style={[styles.chip, { backgroundColor: chip.bg, color: chip.text }]}>{seaState.condition}</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Label>Marea</Label>
          <View style={styles.inline}>
            <TideArrow size={20} color={c.primary} />
            <Text style={{ color: c.foreground, fontSize: 20, fontWeight: "600" }}>
              {seaState.isRising ? "Subiendo" : "Bajando"}
            </Text>
          </View>
          {nextTide && (
            <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
              {nextTide.type}{" "}
              {formatWindowTime(nextTide.date).replace(/^Hoy /, "a las ").replace(/^Mañana/, "mañana")}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.sep, { backgroundColor: c.border }]} />

      <View style={{ gap: 16 }}>
        <CardHeading
          icon={<Clock size={20} color={c.secondaryForeground} />}
          title="Posibles ventanas"
          subtitle="Entre las 6 y las 20 h"
          extra={<InfoTip text="Los mejores horarios para hacer deporte dentro de las próximas horas." />}
        />
        <View style={{ gap: 8 }}>
          {validWindows.length > 0 ? (
            validWindows.map((activity, idx) => {
              const s = getScoreStyle(activity.data.score, dark);
              return (
                <View key={`${activity.label}-${idx}`} style={[styles.window, { backgroundColor: c.highlight }]}>
                  <View style={styles.inline}>
                    {activity.icon}
                    <Text style={{ color: c.foreground, fontWeight: "500" }}>{activity.label}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>
                      {activity.data.start && activity.data.end
                        ? formatWindowRange(activity.data.start, activity.data.end)
                        : activity.data.date && formatWindowTime(activity.data.date)}
                    </Text>
                    <View style={styles.inline}>
                      <View style={[styles.dot, { backgroundColor: s.segment }]} />
                      <Text style={{ color: s.text, fontSize: 12, fontWeight: "600" }}>
                        {getWindowLabel(activity.data.score)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={[styles.window, { backgroundColor: c.highlight, gap: 12 }]}>
              <Waves size={20} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.foreground, fontSize: 14 }}>Nada destacable en las próximas horas.</Text>
                <Text style={{ color: c.mutedForeground, fontSize: 14 }}>Volvé a chequear más tarde.</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: { alignSelf: "flex-start", fontSize: 16, fontWeight: "600", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, overflow: "hidden" },
  sep: { height: 1 },
  window: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
