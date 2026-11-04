import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Info, MapPin, Waves } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { FORM_URL } from "@/lib/links";

export function Header({ onOpenGuide, highlightGuide = false }: { onOpenGuide?: () => void; highlightGuide?: boolean }) {
  const c = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: c.chrome, borderBottomColor: c.chromeBorder }]}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: c.primary }]}>
          <Waves size={20} color={c.primaryForeground} />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: c.foreground }}>Olitas</Text>
          <Text style={{ fontSize: 12, color: c.mutedForeground }}>No te comas el viaje</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => Linking.openURL(FORM_URL)}
          style={[styles.pill, { borderColor: c.primary + "66", backgroundColor: c.primary + "1a" }]}
        >
          <MapPin size={14} color={c.primary} />
          <Text style={{ color: c.primary, fontSize: 12, fontWeight: "600" }}>¿En la playa?</Text>
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
    borderBottomWidth: 1,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  guide: { padding: 6, borderRadius: 999 },
});
