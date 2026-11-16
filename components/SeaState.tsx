import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowDown, ArrowUp, Check, Clock, Waves } from "lucide-react-native";
import { SupIcon, SwimIcon } from "./icons";
import { processData } from "@/hooks/use-processData";
import { useRatings } from "@/hooks/use-ratings";
import type { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import { getScoreStyle, useIsDark, useTheme } from "@/lib/theme";
import { Card, CardHeading, Label } from "./ui";
import { InfoTip } from "./InfoTip";
import { ShareWhatsAppButton, buildShareText } from "./ShareWhatsApp";
import { StoryShareButton, type StoryData } from "./StoryShare";
import { statsAt } from "@/lib/share-stats";

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

const lowerDay = (s: string) => s.replace(/^Hoy/, "hoy").replace(/^Mañana/, "mañana");

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
  // Ventanas elegidas para compartir (null = la mejor, por defecto)
  const [picked, setPicked] = useState<string[] | null>(null);
  const ratings = useRatings(processedData, beach.name, beach.orientation ?? 90, beach, data, forecast, selectedHour);
  const bestWindows = ratings.bestWindows;
  const { seaState } = processedData;
  if (!seaState || !bestWindows) return null;

  const nextTide = getNextTideTurn(data, selectedHour ?? new Date());
  const TideArrow = seaState.isRising ? ArrowUp : ArrowDown;

  const iconProps = { size: 20, color: c.primary };
  const activities = [
    { label: "Surf", data: bestWindows.surf, Icon: Waves, verb: "surfear" },
    { label: "SUP", data: bestWindows.sup, Icon: SupIcon, verb: "hacer SUP" },
    { label: "Natación", data: bestWindows.swimming, Icon: SwimIcon, verb: "nadar" },
  ];
  const validWindows = activities
    .filter(a => a.data.date && a.data.score > 5 && a.data.date >= new Date())
    .sort((a, b) => (a.data.start ?? a.data.date!).getTime() - (b.data.start ?? b.data.date!).getTime());

  // Por defecto se comparte la ventana con mejor puntaje; tocando las ventanas se eligen otras
  const top = validWindows.reduce<(typeof validWindows)[number] | null>(
    (best, a) => (!best || a.data.score > best.data.score ? a : best),
    null,
  );
  const selectedLabels = picked ?? (top ? [top.label] : []);
  const selected = validWindows.filter(a => selectedLabels.includes(a.label));
  const toggle = (label: string) =>
    setPicked(selectedLabels.includes(label) ? selectedLabels.filter(l => l !== label) : [...selectedLabels, label]);

  const whenOf = (a: (typeof validWindows)[number]) =>
    lowerDay(a.data.start && a.data.end ? formatWindowRange(a.data.start, a.data.end) : formatWindowTime(a.data.date!));
  const shareText = selected.length
    ? buildShareText(beach.name, selected.map(a => ({ verb: a.verb, when: whenOf(a) })))
    : "";
  const story: StoryData = {
    spot: beach.name,
    items: selected.map(a => ({
      name: a.label,
      verb: a.verb,
      when: whenOf(a),
      label: getWindowLabel(a.data.score),
      icon: p => <a.Icon {...p} />,
    })),
    stats: selected[0] ? statsAt(data, forecast, selected[0].data.start ?? selected[0].data.date!) : [],
  };

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
              const on = selectedLabels.includes(activity.label);
              return (
                <Pressable
                  key={`${activity.label}-${idx}`}
                  onPress={() => toggle(activity.label)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`Compartir ventana de ${activity.label}`}
                  style={[
                    styles.window,
                    { backgroundColor: c.highlight, borderColor: on ? c.highlightBorder : "transparent" },
                  ]}
                >
                  <View style={styles.inline}>
                    <View style={[styles.check, on ? { backgroundColor: c.primary, borderColor: c.primary } : { borderColor: c.highlightBorder }]}>
                      {on && <Check size={12} color={c.primaryForeground} strokeWidth={3} />}
                    </View>
                    <activity.Icon {...iconProps} />
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
                </Pressable>
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
        {validWindows.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: c.mutedForeground, fontSize: 13, textAlign: "center" }}>
              {selected.length ? "Tocá las ventanas para elegir cuáles compartir" : "Elegí al menos una ventana para compartir"}
            </Text>
            <ShareWhatsAppButton text={shareText} disabled={!selected.length} />
            <StoryShareButton data={story} disabled={!selected.length} />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: { alignSelf: "flex-start", fontSize: 16, fontWeight: "600", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, overflow: "hidden" },
  sep: { height: 1 },
  window: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8 },
  check: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
