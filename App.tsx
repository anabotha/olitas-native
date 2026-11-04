import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CircleAlert } from "lucide-react-native";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { GUIDE_STORAGE_KEY, SPOT_STORAGE_KEY } from "@/lib/storage";
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

  useEffect(() => {
    (async () => {
      try {
        const hasVisited = await AsyncStorage.getItem(GUIDE_STORAGE_KEY);
        if (!hasVisited) {
          setShowGuideOnLoad(true);
          await AsyncStorage.setItem(GUIDE_STORAGE_KEY, "true");
        }
        const saved = await AsyncStorage.getItem(SPOT_STORAGE_KEY);
        if (saved) setSelectedSpot(JSON.parse(saved));
      } catch {}
      setSpotReady(true);
    })();
  }, []);

  // No pedimos datos hasta leer el spot guardado, para evitar cargar el default y después recargar
  const activeSpot = spotReady ? selectedSpot : null;
  const { data, error, isLoading } = useMarineWeather(activeSpot);
  const { forecastData, forecastIsLoading } = useForecast(activeSpot);
  const showLoading = !spotReady || isLoading || forecastIsLoading;
  const hourLabel = `${selectedHour.getHours()}:00hs`;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.chrome }]} edges={["top"]}>
      <Header onOpenGuide={() => setGuideOpen(true)} highlightGuide={showGuideOnLoad} />
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.main}>
          <View style={{ gap: 12 }}>
            <Text style={[styles.h2, { color: c.foreground }]}>¿Cómo está el mar?</Text>
            <View style={styles.selectors}>
              <HourSelector selectedHour={selectedHour} onSelectHour={setSelectedHour} />
              <SpotSelector selectedSpot={selectedSpot} onSelectSpot={setSelectedSpot} />
            </View>
            <Text style={{ color: c.mutedForeground, fontSize: 16 }}>Oleaje, viento y temperatura para tu próxima sesión.</Text>
          </View>

          {showLoading && !error && <LoadingState />}

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
  error: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16 },
});
