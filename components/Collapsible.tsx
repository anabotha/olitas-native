import { ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  info,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  info?: ReactNode;
}) {
  const c = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(o => !o)} style={styles.trigger} accessibilityLabel={open ? "Colapsar" : "Expandir"}>
          <Text style={[styles.title, { color: c.mutedForeground }]}>{title}</Text>
          {info}
          <View style={{ flex: 1 }} />
          <ChevronDown size={16} color={c.mutedForeground} style={{ transform: [{ rotate: open ? "0deg" : "-90deg" }] }} />
        </Pressable>
      </View>
      {open && <View style={{ marginTop: 16 }}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center" },
  trigger: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  title: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1.5 },
});
