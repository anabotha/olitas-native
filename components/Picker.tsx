import { ReactNode, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronDown, Search } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export interface PickerOption<T> {
  key: string;
  label: string;
  sublabel?: string;
  value: T;
}

interface PickerProps<T> {
  title: string;
  options: PickerOption<T>[];
  selectedKey: string;
  /** Texto del botón (por defecto, el label de la opción elegida) */
  buttonLabel?: string;
  onSelect: (value: T) => void;
  searchable?: boolean;
  icon?: ReactNode;
  /** Algo al costado derecho de cada opción (ej. la estrella de favoritas) */
  renderTrailing?: (option: PickerOption<T>) => ReactNode;
}

// Selector modal de lista: reemplaza a los dropdowns de la versión web
export function Picker<T>({ title, options, selectedKey, buttonLabel, onSelect, searchable, icon, renderTrailing }: PickerProps<T>) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find(o => o.key === selectedKey);
  const q = search.toLowerCase();
  const filtered = searchable
    ? options.filter(o => o.label.toLowerCase().includes(q) || (o.sublabel?.toLowerCase().includes(q) ?? false))
    : options;

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.button, { backgroundColor: c.card, borderColor: c.border }]}
      >
        {icon}
        <View>
          <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "600" }}>{buttonLabel ?? selected?.label}</Text>
          {selected?.sublabel ? <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{selected.sublabel}</Text> : null}
        </View>
        <ChevronDown size={16} color={c.mutedForeground} />
      </Pressable>

      <Modal transparent animationType="slide" visible={open} onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={[styles.sheet, { backgroundColor: c.card }]}>
            <Text style={[styles.sheetTitle, { color: c.foreground }]}>{title}</Text>
            {searchable && (
              <View style={[styles.search, { borderColor: c.border }]}>
                <Search size={16} color={c.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Busca tu lugar..."
                  placeholderTextColor={c.mutedForeground}
                  style={{ flex: 1, color: c.foreground, fontSize: 14, padding: 0 }}
                />
              </View>
            )}
            <FlatList
              data={filtered}
              keyExtractor={o => o.key}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text style={{ color: c.mutedForeground, textAlign: "center", padding: 16 }}>No hay resultados</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    close();
                  }}
                  style={[styles.item, styles.itemRow, item.key === selectedKey && { backgroundColor: c.secondary }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.foreground, fontSize: 15, fontWeight: item.key === selectedKey ? "600" : "400" }}>
                      {item.label}
                    </Text>
                    {item.sublabel ? <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{item.sublabel}</Text> : null}
                  </View>
                  {renderTrailing?.(item)}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backdrop: { flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 12, paddingBottom: 28 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  search: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  item: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
});
