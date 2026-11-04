import { ReactNode, useState } from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";
import { Info } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

// Ícono "i" que abre un cartel con la explicación (tap, no hay hover en mobile)
export function InfoTip({ text, children }: { text?: string; children?: ReactNode }) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityLabel="Más información">
        <Info size={14} color={c.mutedForeground} />
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.box, { backgroundColor: c.card, borderColor: c.border }]}>
            {children ?? <Text style={{ color: c.foreground, fontSize: 14 }}>{text}</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#0006", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { maxWidth: 360, width: "100%", borderRadius: 14, borderWidth: 1, padding: 18 },
});
