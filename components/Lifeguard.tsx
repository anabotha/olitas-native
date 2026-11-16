import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { ShieldCheck, ShieldOff } from "lucide-react-native";
import { useIsDark, useTheme } from "@/lib/theme";
import { Card, CardHeading } from "./ui";
import {
  LIFEGUARD,
  LIFEGUARD_HOURS_LABEL,
  LIFEGUARD_SEASON_LABEL,
  LIFEGUARD_SEASON_START_LABEL,
  daysUntilSeasonStart,
  getLifeguardStatus,
  isLastSeasonDay,
  type LifeguardStatus,
} from "@/lib/lifeguard";

const pad = (n: number) => String(n).padStart(2, "0");

// Un tono plano por estado (misma paleta Tailwind que la versión web): [claro, oscuro]
type Tone = { bg: string; border: string; iconBg: string; icon: string; accent: string };
const TONES: Record<LifeguardStatus, [Tone, Tone]> = {
  covered: [
    { bg: "#f0fdfa", border: "#99f6e4b3", iconBg: "#ccfbf1", icon: "#0f766e", accent: "#0f766e" },
    { bg: "#042f2e4d", border: "#134e4a80", iconBg: "#134e4a80", icon: "#5eead4", accent: "#2dd4bf" },
  ],
  "outside-hours": [
    { bg: "#fff7ed", border: "#fed7aab3", iconBg: "#ffedd5", icon: "#ea580c", accent: "#ea580c" },
    { bg: "#4314074d", border: "#7c2d1280", iconBg: "#7c2d1280", icon: "#fdba74", accent: "#fb923c" },
  ],
  // Se acerca el verano: tono cálido, no de alerta
  "off-season": [
    { bg: "#fffbeb", border: "#fde68ab3", iconBg: "#fef3c7", icon: "#d97706", accent: "#d97706" },
    { bg: "#451a034d", border: "#78350f80", iconBg: "#78350f80", icon: "#fcd34d", accent: "#fbbf24" },
  ],
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function Lifeguard({ selectedHour }: { selectedHour: Date }) {
  const c = useTheme();
  const isDark = useIsDark();
  const wide = useWindowDimensions().width >= 768;

  const status = getLifeguardStatus(selectedHour);
  const tone = TONES[status][isDark ? 1 : 0];
  const h = selectedHour.getHours();
  const from = `${pad(LIFEGUARD.from)}:00`;
  const to = `${pad(LIFEGUARD.to)}:00`;

  let title: string;
  // Número protagonista + unidad; null cuando no hay nada que contar
  let count: { n: number; unit: string } | null;
  let message: string;
  let detail: string;

  if (status === "covered") {
    const left = LIFEGUARD.to - h;
    title = "Con guardavidas";
    count = { n: left, unit: plural(left, "hora", "horas") };
    message = "más con guardavidas en la playa";
    detail = `Están hasta las ${to}`;
  } else if (status === "outside-hours") {
    title = `Sin guardavidas a las ${h}:00`;
    if (h < LIFEGUARD.from) {
      const wait = LIFEGUARD.from - h;
      count = { n: wait, unit: plural(wait, "hora", "horas") };
      message = "para que lleguen los guardavidas";
      detail = `Hoy desde las ${from}`;
    } else if (isLastSeasonDay(selectedHour)) {
      count = null;
      message = "Terminó la temporada. Por ahora, nadá con cuidado.";
      detail = `Vuelven el ${LIFEGUARD_SEASON_START_LABEL}`;
    } else {
      const wait = 24 - h + LIFEGUARD.from;
      count = { n: wait, unit: plural(wait, "hora", "horas") };
      message = "para que vuelvan los guardavidas";
      detail = `Mañana desde las ${from}`;
    }
  } else {
    const days = daysUntilSeasonStart(selectedHour);
    title = "Fuera de temporada";
    count = { n: days, unit: plural(days, "día", "días") };
    message = "para que vuelvan los guardavidas";
    detail = `${LIFEGUARD_SEASON_START_LABEL} · ${LIFEGUARD_HOURS_LABEL}`;
  }

  const Icon = status === "covered" ? ShieldCheck : ShieldOff;
  const divider = wide
    ? { borderLeftWidth: 1, borderColor: c.border }
    : { borderTopWidth: 1, borderColor: c.border };

  return (
    <Card style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={wide ? styles.rowWide : undefined}>
        <View style={[styles.section, wide && styles.half]}>
          <CardHeading
            icon={<Icon size={20} color={tone.icon} />}
            iconBg={tone.iconBg}
            title={title}
            subtitle={`Temporada ${LIFEGUARD_SEASON_LABEL}`}
          />
        </View>
        <View style={[styles.section, styles.countRow, divider, wide && styles.half]}>
          {count && (
            <View style={styles.count}>
              <Text style={[styles.countN, { color: tone.accent }]}>{count.n}</Text>
              <Text style={[styles.countUnit, { color: tone.accent }]}>{count.unit}</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.message, { color: c.foreground }]}>{message}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 14 }}>{detail}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, gap: 0 },
  rowWide: { flexDirection: "row", alignItems: "center" },
  half: { flex: 1, alignSelf: "stretch", justifyContent: "center" },
  section: { padding: 20 },
  countRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  count: { alignItems: "center" },
  countN: { fontSize: 36, fontWeight: "700", letterSpacing: -0.5, fontVariant: ["tabular-nums"], lineHeight: 38 },
  countUnit: { marginTop: 4, fontSize: 12, fontWeight: "600" },
  message: { fontSize: 16, fontWeight: "600" },
});
