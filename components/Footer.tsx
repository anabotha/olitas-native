import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Globe, Mail, MapPin, TriangleAlert } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { CONTACT_URL, FORM_URL, OPEN_METEO_URL, PORTFOLIO_URL } from "@/lib/links";

export function Footer() {
  const c = useTheme();
  const link = (url: string, label: string, icon: React.ReactNode) => (
    <Pressable onPress={() => Linking.openURL(url)} style={styles.link}>
      {icon}
      <Text style={{ color: c.mutedForeground, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.footer, { backgroundColor: c.chrome, borderTopColor: c.chromeBorder }]}>
      <View style={[styles.warning, { backgroundColor: c.warning + "1a", borderColor: c.warning + "4d" }]}>
        <TriangleAlert size={16} color={c.warningForeground} />
        <Text style={{ color: c.warningForeground, fontSize: 12, fontWeight: "500", flex: 1 }}>
          Siempre chequeá las condiciones antes de salir al agua.
        </Text>
      </View>

      <View style={styles.nav}>
        {link(CONTACT_URL, "Contacto", <Mail size={16} color={c.mutedForeground} />)}
        {link(PORTFOLIO_URL, "Portfolio", <Globe size={16} color={c.mutedForeground} />)}
        {link(FORM_URL, "¿En la playa?", <MapPin size={16} color={c.mutedForeground} />)}
      </View>

      <Text style={{ color: c.mutedForeground, fontSize: 11 }}>
        Olitas · Datos por{" "}
        <Text style={{ textDecorationLine: "underline" }} onPress={() => Linking.openURL(OPEN_METEO_URL)}>
          Open-Meteo
        </Text>
      </Text>

      <Text style={{ color: c.mutedForeground, fontSize: 10, textAlign: "center", lineHeight: 15 }}>
        Los datos son pronósticos y pueden no ser exactos. Olitas es una guía orientativa y no se responsabiliza por
        decisiones tomadas en base a esta información.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 32, borderTopWidth: 1, alignItems: "center", gap: 18, paddingHorizontal: 16, paddingVertical: 24 },
  warning: { flexDirection: "row", gap: 8, alignItems: "flex-start", borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  nav: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 20 },
  link: { flexDirection: "row", alignItems: "center", gap: 6 },
});
