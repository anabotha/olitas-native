// Modo "estoy en la playa": si la ubicación dice que estás en una playa, arriba de todo
// se muestra cómo está AHORA, en grande y sin vueltas.
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CircleAlert, MapPin, ShieldCheck, ShieldOff, Waves } from "lucide-react-native";
import { useRatings } from "@/hooks/use-ratings";
import { useCurrentSafety } from "@/hooks/use-safety";
import { LIFEGUARD, getLifeguardStatus } from "@/lib/lifeguard";
import { statsAt } from "@/lib/share-stats";
import { getScoreStyle, useIsDark, useTheme } from "@/lib/theme";
import type { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import { SupIcon, SwimIcon } from "./icons";

const label = (score: number) =>
  score <= 1 ? "No da" : score <= 2 ? "Malo" : score <= 4 ? "Flojo" : score <= 6 ? "Bien" : score <= 8 ? "Muy bueno" : "Excelente";

export function BeachNow({
  spot,
  data,
  forecast,
}: {
  spot: SpotLocation;
  data: MarineWeatherData;
  forecast: ForecastData | undefined;
}) {
  const c = useTheme();
  const dark = useIsDark();
  const now = new Date();
  now.setMinutes(0, 0, 0);

  const { activities } = useRatings(null, spot.name, spot.orientation ?? 90, spot, data, forecast, now);
  const safety = useCurrentSafety(data, forecast, spot, now);
  const lifeguard = getLifeguardStatus(now);
  const stats = statsAt(data, forecast, now);

  const tiles: { name: string; score: number; icon: (color: string) => ReactNode }[] = [
    { name: "Natación", score: activities.swimming.score, icon: color => <SwimIcon size={26} color={color} /> },
    { name: "SUP", score: activities.sup.score, icon: color => <SupIcon size={26} color={color} /> },
    { name: "Surf", score: activities.surf.score, icon: color => <Waves size={26} color={color} /> },
  ];

  const LifeguardIcon = lifeguard === "covered" ? ShieldCheck : ShieldOff;
  const lifeguardText =
    lifeguard === "covered"
      ? `Con guardavidas hasta las ${LIFEGUARD.to}:00`
      : lifeguard === "outside-hours"
        ? "Ahora no hay guardavidas"
        : "Fuera de temporada de guardavidas";

  return (
    <View style={[styles.card, { backgroundColor: c.highlight, borderColor: c.highlightBorder }]}>
      <View style={styles.head}>
        <View style={[styles.pin, { backgroundColor: c.primary }]}>
          <MapPin size={18} color={c.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.foreground }]}>Estás en {spot.name}</Text>
          <Text style={{ color: c.mutedForeground, fontSize: 13 }}>Así está ahora</Text>
        </View>
      </View>

      {(safety.color === "red" || safety.color === "yellow") && (
        <View style={[styles.alert, { backgroundColor: c.destructive + "14", borderColor: c.destructive + "40" }]}>
          <CircleAlert size={18} color={c.destructive} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontWeight: "700", fontSize: 14 }}>{safety.label}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{safety.message}</Text>
          </View>
        </View>
      )}

      <View style={styles.tiles}>
        {tiles.map(t => {
          const s = getScoreStyle(t.score, dark);
          return (
            <View key={t.name} style={[styles.tile, { backgroundColor: s.bg }]}>
              {t.icon(s.text)}
              <Text style={{ color: c.foreground, fontSize: 13, fontWeight: "600" }}>{t.name}</Text>
              <Text style={{ color: s.text, fontSize: 17, fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
                {label(t.score)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.stats, { borderTopColor: c.border }]}>
        {stats.map(s => (
          <View key={s.label} style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{s.label}</Text>
            <Text style={{ color: c.foreground, fontSize: 20, fontWeight: "700" }} numberOfLines={1}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.lifeguard}>
        <LifeguardIcon size={16} color={lifeguard === "covered" ? c.accent : c.warning} />
        <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{lifeguardText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 16, padding: 16, gap: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  pin: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  alert: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  tiles: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, alignItems: "center", gap: 4, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6 },
  stats: { flexDirection: "row", borderTopWidth: 1, paddingTop: 12 },
  statLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  lifeguard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
});
