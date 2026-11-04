import { StyleSheet, Text, View } from "react-native";
import { ShieldCheck, ShieldOff } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { LIFEGUARD_HOURS_LABEL, LIFEGUARD_SEASON_LABEL, getLifeguardStatus } from "@/lib/lifeguard";

export function Lifeguard({ selectedHour }: { selectedHour: Date }) {
  const c = useTheme();
  const status = getLifeguardStatus(selectedHour);
  const covered = status === "covered";
  const hour = `${selectedHour.getHours()}:00hs`;

  const badge =
    status === "covered"
      ? `Con guardavidas a las ${hour}`
      : status === "outside-hours"
        ? `Sin guardavidas a las ${hour}`
        : "Fuera de temporada";

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.row}>
        {covered ? <ShieldCheck size={20} color={c.accent} /> : <ShieldOff size={20} color={c.warning} />}
        <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "600", flex: 1 }}>{badge}</Text>
      </View>
      <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
        Horario: {LIFEGUARD_HOURS_LABEL} · Temporada: {LIFEGUARD_SEASON_LABEL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
