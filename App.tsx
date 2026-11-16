import { useCallback, useEffect, useState } from "react";
import { AppState, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CircleAlert, WifiOff } from "lucide-react-native";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { GUIDE_STORAGE_KEY } from "@/lib/storage";
import { ON_BEACH_KM, locateNearestSpot, resolveSpotWithDistance } from "@/lib/nearest-spot";
import { refreshDailyNotification, syncBackgroundTask } from "@/lib/daily-notification";
import { refreshHomeWidget } from "@/lib/home-widget";
import { useIsDark, useTheme } from "@/lib/theme";
import { useMarineWeather } from "@/hooks/use-marineWeather";
import { useForecast } from "@/hooks/use-forecast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotSelector } from "@/components/SpotSelector";
import { HourSelector } from "@/components/HourSelector";
import { LoadingState } from "@/components/LoadingState";
import { CollapsibleSection } from "@/components/Collapsible";
import { InfoTip } from "@/components/InfoTip";
import { ScoreLegend } from "@/components/ScoreLegend";
import ActivityCheck from "@/components/ActivityCheck";
import { ConditionsPanel } from "@/components/ConditionsPanel";
import { HourlyForecast } from "@/components/HourlyForecast";
import { SeaState } from "@/components/SeaState";
import { GuideModal } from "@/components/GuideModal";
import { Lifeguard } from "@/components/Lifeguard";
import { Sidebar } from "@/components/Sidebar";
import { BeachNow } from "@/components/BeachNow";

// "hoy a las 18:40" / "ayer a las 9:05" / "el 14/11 a las 9:05"
function offlineLabel(d: Date) {
  const now = new Date();
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  );
  if (days === 0) return `de hoy a las ${time}`;
  if (days === 1) return `de ayer a las ${time}`;
  return `del ${d.getDate()}/${d.getMonth() + 1} a las ${time}`;
}

function Home() {
  const c = useTheme();
  const [selectedSpot, setSelectedSpot] = useState<SpotLocation>(DEFAULT_SPOTS[0]);
  const [selectedHour, setSelectedHour] = useState<Date>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });
  const [showGuideOnLoad, setShowGuideOnLoad] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [spotReady, setSpotReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Playa en la que está parado el usuario (modo "estoy en la playa"), si está en una
  const [onBeach, setOnBeach] = useState<SpotLocation | null>(null);
  // Solo desarrollo: simular que estás en la playa elegida (para probar el modo playa desde casa)
  const [simulateBeach, setSimulateBeach] = useState(false);

  // Playa más cercana (si hay permiso de ubicación) o la última elegida
  const loadSpot = useCallback(async () => {
    const { spot, distanceKm } = await resolveSpotWithDistance();
    setSelectedSpot(spot);
    setOnBeach(distanceKm != null && distanceKm <= ON_BEACH_KM ? spot : null);
    setSpotReady(true);
  }, []);

  // Al volver a la app revisamos si llegaste (o te fuiste) de la playa, sin cambiar la playa elegida
  const checkOnBeach = useCallback(async () => {
    const nearest = await locateNearestSpot({ ask: false });
    setOnBeach(nearest && nearest.distanceKm <= ON_BEACH_KM ? nearest.spot : null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const hasVisited = await AsyncStorage.getItem(GUIDE_STORAGE_KEY);
        if (!hasVisited) {
          setShowGuideOnLoad(true);
          await AsyncStorage.setItem(GUIDE_STORAGE_KEY, "true");
        }
      } catch {}
      await loadSpot();
    })();
  }, [loadSpot]);

  // Recalcula el aviso de las 19 h al abrir la app y cada vez que vuelve a primer plano
  useEffect(() => {
    if (!spotReady) return;
    // La tarea de segundo plano actualiza el aviso de las 19 h (si está prendido) y el widget
    syncBackgroundTask(true);
    const refresh = () => {
      refreshDailyNotification().catch(() => {});
      refreshHomeWidget().catch(() => {});
    };
    refresh();
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") {
        refresh();
        checkOnBeach();
      }
    });
    return () => sub.remove();
  }, [spotReady, selectedSpot]);

  // No pedimos datos hasta leer el spot guardado, para evitar cargar el default y después recargar
  const activeSpot = spotReady ? selectedSpot : null;
  const { data, error, isLoading, offlineSince } = useMarineWeather(activeSpot);
  const { forecastData, forecastIsLoading, forecastOfflineSince } = useForecast(activeSpot);
  // Si alguno de los dos vino del caché, mostramos la hora del más viejo
  const offlineAt = [offlineSince, forecastOfflineSince]
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const showLoading = !spotReady || isLoading || forecastIsLoading;
  const hourLabel = `${selectedHour.getHours()}:00hs`;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.chrome }]} edges={["top"]}>
      <Header onOpenGuide={() => setGuideOpen(true)} onOpenMenu={() => setMenuOpen(true)} highlightGuide={showGuideOnLoad} />
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.main}>
          {/* Modo "estoy en la playa": cómo está ahora, arriba de todo */}
          {(simulateBeach || onBeach?.name === selectedSpot.name) && data && !showLoading && (
            <BeachNow spot={selectedSpot} data={data} forecast={forecastData} />
          )}

          <View style={{ gap: 12 }}>
            <Text style={[styles.h2, { color: c.foreground }]}>¿Cómo está el mar?</Text>
            <View style={styles.selectors}>
              <HourSelector selectedHour={selectedHour} onSelectHour={setSelectedHour} />
              <SpotSelector selectedSpot={selectedSpot} onSelectSpot={setSelectedSpot} />
            </View>
            <Text style={{ color: c.mutedForeground, fontSize: 16 }}>Oleaje, viento y temperatura para tu próxima sesión.</Text>
          </View>

          {showLoading && !error && <LoadingState />}

          {offlineAt && !showLoading && (
            <View style={[styles.offline, { borderColor: c.warning + "55", backgroundColor: c.warning + "1a" }]}>
              <WifiOff size={18} color={c.warningForeground} />
              <Text style={{ flex: 1, color: c.foreground, fontSize: 13 }}>
                Sin conexión. Te mostramos el pronóstico guardado {offlineLabel(offlineAt)}.
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.error, { borderColor: c.destructive + "33", backgroundColor: c.destructive + "0d" }]}>
              <CircleAlert size={20} color={c.destructive} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>No se pudieron cargar los datos :(</Text>
                <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                  Intenta de nuevo en un momento. El mar no se va a ningun lado.
                </Text>
              </View>
            </View>
          )}

          {data && !error && !showLoading && (
            <View style={{ gap: 32 }}>
              <CollapsibleSection
                title="actividad"
                info={
                  <InfoTip>
                    <ScoreLegend />
                  </InfoTip>
                }
              >
                <ActivityCheck selectedSpot={selectedSpot} data={data} forecastData={forecastData} selectedHour={selectedHour} />
              </CollapsibleSection>

              <CollapsibleSection title={`Condiciones ${hourLabel}`}>
                <ConditionsPanel forecast={forecastData} conditions={data} selectedHour={selectedHour} selectedSpot={selectedSpot} />
              </CollapsibleSection>

              <CollapsibleSection title={`Pronostico ${hourLabel}`}>
                <HourlyForecast forecast={forecastData} selectedHour={selectedHour} />
              </CollapsibleSection>

              <CollapsibleSection title="Guardavidas">
                <Lifeguard selectedHour={selectedHour} />
              </CollapsibleSection>

              <CollapsibleSection title="Estado del Mar">
                <SeaState data={data} forecast={forecastData} beach={selectedSpot} selectedHour={selectedHour} />
              </CollapsibleSection>
            </View>
          )}
        </View>
        <Footer />
      </ScrollView>
      <GuideModal visible={guideOpen} onClose={() => setGuideOpen(false)} />
      <Sidebar
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onUseLocationChange={() => loadSpot()}
        simulateBeach={simulateBeach}
        onSimulateBeachChange={setSimulateBeach}
      />
    </SafeAreaView>
  );
}

export default function App() {
  const dark = useIsDark();
  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? "light" : "dark"} />
      <Home />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  main: { padding: 20, gap: 24 },
  h2: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  selectors: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  offline: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  error: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16 },
});
