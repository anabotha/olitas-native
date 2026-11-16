import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>
      {children}
    </View>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useTheme();
  return <Text style={[styles.label, { color: c.mutedForeground }, style]}>{children}</Text>;
}

// Encabezado de card: ícono en caja + título + subtítulo
export function CardHeading({
  icon,
  title,
  subtitle,
  extra,
  iconBg,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  extra?: ReactNode;
  iconBg?: string;
}) {
  const c = useTheme();
  return (
    <View style={styles.heading}>
      <View style={[styles.iconBox, { backgroundColor: iconBg ?? c.secondary }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
          {extra}
        </View>
        {subtitle ? <Text style={{ color: c.mutedForeground, fontSize: 14 }}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 20, gap: 16, overflow: "hidden" },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 16, fontWeight: "600" },
});
