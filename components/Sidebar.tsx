import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, MapPin, Send, Waves, X } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotifActivity,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import {
  NOTIFY_HOUR,
  refreshDailyNotification,
  requestNotificationPermission,
  sendTestNotification,
  type DailyMessage,
} from "@/lib/daily-notification";
import { DANGER_WIND_KMH } from "@/lib/day-outlook";
import { getUseLocation, setUseLocation } from "@/lib/nearest-spot";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

const ACTIVITY_LABELS: Record<NotifActivity, string> = {
  surf: "Surf",
  sup: "SUP",
  swimming: "Natación",
};

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
  onUseLocationChange?: (value: boolean) => void;
  /** Solo desarrollo: forzar el modo "estoy en la playa" para probarlo desde cualquier lado */
  simulateBeach?: boolean;
  onSimulateBeachChange?: (value: boolean) => void;
};

// El Modal abre una vista nativa aparte: en iOS necesita su propio SafeAreaProvider
// para conocer el notch y la barra de estado (si no, el panel queda corrido hacia arriba)
// La animación (panel + fondo) la maneja el panel con un solo valor, así van sincronizados;
// el Modal no anima por su cuenta.
export function Sidebar(props: SidebarProps) {
  // El botón "atrás" de Android cierra con la misma animación que el resto
  const closeRef = useRef<() => void>(props.onClose);
  return (
    <Modal
      transparent
      visible={props.visible}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => closeRef.current()}
    >
      <SafeAreaProvider>
        <SidebarPanel {...props} closeRef={closeRef} />
      </SafeAreaProvider>
    </Modal>
  );
}

function SidebarPanel({
  visible,
  onClose,
  onUseLocationChange,
  simulateBeach,
  onSimulateBeachChange,
  closeRef,
}: SidebarProps & { closeRef: { current: () => void } }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const width = Math.min(340, useWindowDimensions().width * 0.9);
  // 0 = cerrado, 1 = abierto
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] });

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [useLocation, setUseLocationState] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState<DailyMessage | null>(null);

  useEffect(() => {
    if (!visible) return;
    loadNotificationPrefs().then(setPrefs);
    getUseLocation().then(setUseLocationState);
    setPreview(null);
    closing.current = false;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [visible]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start(() => onClose());
  };
  closeRef.current = close;

  const update = async (next: NotificationPrefs) => {
    if (next.enabled && !prefs.enabled) {
      const granted = await requestNotificationPermission();
      setPermissionDenied(isNative && !granted);
      if (isNative && !granted) return;
    }
    setPrefs(next);
    await saveNotificationPrefs(next);
    refreshDailyNotification().catch(() => {});
  };

  const toggleLocation = async (value: boolean) => {
    setUseLocationState(value);
    await setUseLocation(value);
    onUseLocationChange?.(value);
  };

  const test = async () => {
    setTesting(true);
    try {
      setPreview(await sendTestNotification());
    } catch {
      setPreview({ title: "No se pudo calcular", body: "Revisá la conexión e intentá de nuevo." });
    }
    setTesting(false);
  };

  const off = !prefs.enabled;

  return (
    <View style={styles.root}>
        {/* Fondo oscuro detrás de todo, con la misma animación que el panel */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Cerrar panel" />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            { width, backgroundColor: c.background, borderRightColor: c.border, transform: [{ translateX }] },
          ]}
        >
          <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left }}>
            <View style={[styles.header, { borderBottomColor: c.border }]}>
              <View style={[styles.logo, { backgroundColor: c.primary }]}>
                <Waves size={20} color={c.primaryForeground} />
              </View>
              <Text style={[styles.title, { color: c.foreground }]}>Configuración</Text>
              <Pressable onPress={close} accessibilityLabel="Cerrar" hitSlop={10} style={styles.close}>
                <X size={20} color={c.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              {/* ── Avisos ─────────────────────────── */}
              <Section icon={<Bell size={16} color={c.primary} />} title="Avisos diarios">
                <Row
                  label={`Aviso de las ${NOTIFY_HOUR} h`}
                  hint="Te contamos cómo viene mañana en tu playa."
                  value={prefs.enabled}
                  onChange={v => update({ ...prefs, enabled: v })}
                />
                {permissionDenied && (
                  <Pressable onPress={() => Linking.openSettings()}>
                    <Text style={{ color: c.destructive, fontSize: 13 }}>
                      Las notificaciones están bloqueadas. Tocá acá para activarlas en los ajustes del celular.
                    </Text>
                  </Pressable>
                )}
                {!isNative && (
                  <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
                    Los avisos llegan solo en la app del celular.
                  </Text>
                )}

                <View style={[styles.group, { opacity: off ? 0.45 : 1 }]} pointerEvents={off ? "none" : "auto"}>
                  <Row
                    label="Días buenos"
                    hint="“Che... mañana alto día para surfear”, “está god para nadar”... según la actividad."
                    value={prefs.goodDays}
                    onChange={v => update({ ...prefs, goodDays: v })}
                  />
                  <Row
                    label="Viento fuerte"
                    hint={`Si mañana hay viento o ráfagas de ${DANGER_WIND_KMH} km/h o más.`}
                    value={prefs.windAlerts}
                    onChange={v => update({ ...prefs, windAlerts: v })}
                  />
                  <Text style={[styles.subLabel, { color: c.mutedForeground }]}>Avisarme días buenos para</Text>
                  {(Object.keys(ACTIVITY_LABELS) as NotifActivity[]).map(a => (
                    <Row
                      key={a}
                      label={ACTIVITY_LABELS[a]}
                      value={prefs.activities[a]}
                      onChange={v => update({ ...prefs, activities: { ...prefs.activities, [a]: v } })}
                    />
                  ))}
                </View>

                <Pressable
                  onPress={test}
                  disabled={testing}
                  style={[styles.testBtn, { borderColor: c.primary + "66", backgroundColor: c.primary + "1a" }]}
                >
                  <Send size={14} color={c.primary} />
                  <Text style={{ color: c.primary, fontWeight: "600", fontSize: 14, flexShrink: 1, textAlign: "center" }}>
                    {testing ? "Calculando..." : "Probar aviso de mañana"}
                  </Text>
                </Pressable>
                {preview && (
                  <View style={[styles.preview, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={{ color: c.foreground, fontWeight: "600", fontSize: 14 }}>{preview.title}</Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{preview.body}</Text>
                  </View>
                )}
              </Section>

              {/* ── Ubicación ──────────────────────── */}
              <Section icon={<MapPin size={16} color={c.primary} />} title="Ubicación">
                <Row
                  label="Usar la playa más cercana"
                  hint="Al abrir la app elegimos la playa más cerca tuyo. Si lo apagás, usamos la última que elegiste."
                  value={useLocation}
                  onChange={toggleLocation}
                />
                {/* Solo aparece en desarrollo (Expo Go), no en la app instalada */}
                {__DEV__ && onSimulateBeachChange && (
                  <Row
                    label="Simular que estoy en la playa"
                    hint="Solo para probar: muestra el modo playa con la playa elegida."
                    value={!!simulateBeach}
                    onChange={onSimulateBeachChange}
                  />
                )}
              </Section>
            </ScrollView>
          </View>
        </Animated.View>
    </View>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.sectionHead}>
        {icon}
        <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.foreground, fontSize: 15, fontWeight: "500" }}>{label}</Text>
        {hint ? <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: c.primary, false: c.border }}
        thumbColor={Platform.OS === "android" ? (value ? "#ffffff" : "#f4f4f5") : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  backdrop: { backgroundColor: "#00000066" },
  panel: { alignSelf: "stretch", borderRightWidth: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontWeight: "600" },
  close: { padding: 6 },
  content: { padding: 16, gap: 16 },
  section: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
  group: { gap: 14 },
  subLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  preview: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
});
