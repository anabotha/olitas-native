import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Info, MapPin, Waves } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { FORM_URL } from "@/lib/links";
import { useCompact } from "@/lib/use-compact";

export function Header({
  onOpenGuide,
  onOpenMenu,
  highlightGuide = false,
}: {
  onOpenGuide?: () => void;
  onOpenMenu?: () => void;
  highlightGuide?: boolean;
}) {
  const c = useTheme();
  const compact = useCompact();
  return (
    <View style={[styles.header, { backgroundColor: c.chrome, borderBottomColor: c.chromeBorder }]}>
      <View style={[styles.brand, { flexShrink: 1 }]}>
        <Pressable
          onPress={onOpenMenu}
          disabled={!onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel="Abrir configuración"
          style={({ pressed }) => [styles.logo, { backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Waves size={20} color={c.primaryForeground} />
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: c.foreground }}>Olitas</Text>
          {!compact && (
            <Text numberOfLines={1} style={{ fontSize: 12, color: c.mutedForeground }}>No te comas el viaje</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => Linking.openURL(FORM_URL)}
          accessibilityLabel="¿En la playa? Contanos cómo está"
          style={[styles.pill, compact && styles.pillCompact, { borderColor: c.primary + "66", backgroundColor: c.primary + "1a" }]}
        >
          <MapPin size={compact ? 18 : 14} color={c.primary} />
          {!compact && <Text style={{ color: c.primary, fontSize: 12, fontWeight: "600" }}>¿En la playa?</Text>}
        </Pressable>
        {onOpenGuide && (
          <Pressable
            onPress={onOpenGuide}
            accessibilityLabel="Ver guía"
            style={[styles.guide, highlightGuide && { borderWidth: 2, borderColor: c.primary }]}
          >
            <Info size={20} color={highlightGuide ? c.primary : c.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillCompact: { paddingHorizontal: 8, paddingVertical: 8 },
  guide: { padding: 6, borderRadius: 999 },
});
