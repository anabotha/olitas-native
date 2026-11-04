import { StyleSheet, Text, View } from "react-native";
import { getScoreStyle, useIsDark, useTheme } from "@/lib/theme";

// Misma escala que getScoreStyle (puntaje 0–10)
const LEVELS = [
  { score: 0, label: "Peligroso", hint: "Mejor no meterse" },
  { score: 1, label: "Jodido", hint: "Solo surf: complicado" },
  { score: 5, label: "Flojo", hint: "No es peligroso, pero no está lindo" },
  { score: 7, label: "Bien", hint: "Condiciones decentes" },
  { score: 9, label: "Muy bueno", hint: "Vale la pena ir" },
  { score: 10, label: "Excelente", hint: "Día ideal: arrancá para la playa" },
];

export function ScoreLegend() {
  const c = useTheme();
  const dark = useIsDark();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: c.foreground, fontWeight: "600" }}>¿Cómo leer el puntaje?</Text>
      {LEVELS.map(level => (
        <View key={level.label} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: getScoreStyle(level.score, dark).segment }]} />
          <Text style={{ color: c.foreground, fontSize: 13, flex: 1 }}>
            <Text style={{ fontWeight: "600" }}>{level.label}</Text> · {level.hint}
          </Text>
        </View>
      ))}
      <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Las etiquetas pueden variar según la actividad.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
