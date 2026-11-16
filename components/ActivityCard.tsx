import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ActivityRating } from "@/lib/types";
import { getScoreStyle, useIsDark, useTheme } from "@/lib/theme";
import { Card, CardHeading, Label } from "./ui";
import { ShareableCard } from "./CardShare";

// Más tags que esto sobrecarga la card
const MAX_TAGS = 5;

// Palabras que marcan un factor desfavorable. Los factores son texto libre desde use-ratings,
// así que se detectan por palabra clave para mostrarlos primero (explican por qué baja el puntaje).
const NEGATIVE_FACTOR = /peligro|alerta|desfavorable|confuso|picado|chop|inestable|revuelto|destruid|desordenad|resaca|corriente|bloquead|fuerte|extremo|ráfaga|arrachado|hacia el mar|direccion al mar|de frente|lateral|onshore moderado|débil|chicas|pequeñas|muy corto|sin datos|incompletos/i;

const sortFactors = (factors: string[]) =>
  [...factors].sort((a, b) => Number(NEGATIVE_FACTOR.test(b)) - Number(NEGATIVE_FACTOR.test(a)));

const SCORE_SEGMENTS = 5;

export function ActivityCard({
  activity,
  icon,
  rating,
}: {
  activity: string;
  icon: ReactNode;
  rating: ActivityRating;
}) {
  const c = useTheme();
  const dark = useIsDark();
  const score = getScoreStyle(rating.score, dark);

  let label = rating.label;
  if (rating.label === "Tranqui") {
    if (activity === "Nado en aguas abiertas") label = "Nadable";
  }

  const filledSegments = Math.max(1, Math.ceil((rating.score / 10) * SCORE_SEGMENTS));

  return (
    // Se puede compartir como imagen idéntica a la tarjeta
    <ShareableCard>
      {shareButton => (
    <Card>
      <CardHeading
        icon={icon}
        title={activity}
        right={shareButton}
        subtitle={
          <>
            {rating.description}
            {activity === "Nado en aguas abiertas" && rating.score === 4 ? " apto para avanzados" : ""}
          </>
        }
      />

      <View style={{ gap: 6 }}>
        <Label>Condición general</Label>
        <View style={styles.segments}>
          {Array.from({ length: SCORE_SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[styles.segment, { backgroundColor: i < filledSegments ? score.segment : c.muted }]}
            />
          ))}
        </View>
      </View>

      {rating.factors && rating.factors.length > 0 && (
        <View style={styles.tags}>
          {sortFactors(rating.factors)
            .slice(0, MAX_TAGS)
            .map((factor, i) => (
              <Text
                key={i}
                style={[styles.tag, { borderColor: c.border, backgroundColor: c.background, color: c.mutedForeground }]}
              >
                {factor}
              </Text>
            ))}
        </View>
      )}

      <View style={[styles.status, { backgroundColor: score.bg }]}>
        <Text style={{ color: score.text, fontSize: 14, fontWeight: "700" }}>{label}</Text>
        <View style={[styles.dot, { backgroundColor: score.dot }]} />
      </View>
    </Card>
      )}
    </ShareableCard>
  );
}

const styles = StyleSheet.create({
  segments: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { fontSize: 12, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, overflow: "hidden" },
  status: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
