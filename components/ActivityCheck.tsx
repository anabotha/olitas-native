import { StyleSheet, Text, View } from "react-native";
import { CircleAlert, ShieldOff, Waves } from "lucide-react-native";
import { SupIcon, SwimIcon } from "./icons";
import { LIFEGUARD_HOURS_LABEL, getLifeguardStatus } from "@/lib/lifeguard";
import { processData } from "@/hooks/use-processData";
import { useRatings } from "@/hooks/use-ratings";
import { useCurrentSafety } from "@/hooks/use-safety";
import type { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import { ActivityCard } from "./ActivityCard";

interface ActivityCheckProps {
  data: MarineWeatherData | undefined;
  selectedSpot: SpotLocation | undefined;
  forecastData: ForecastData | undefined;
  selectedHour: Date;
}

export default function ActivityCheck({ data, selectedSpot, forecastData, selectedHour }: ActivityCheckProps) {
  const c = useTheme();
  const processedData = processData(data, forecastData, selectedSpot?.orientation, selectedSpot?.name, selectedHour);
  if (!processedData || !selectedSpot) {
    return <Text style={{ color: c.foreground }}>Hubo un error, proba mas tarde!</Text>;
  }
  return (
    <ActivityCheckContent
      processedData={processedData}
      data={data}
      selectedSpot={selectedSpot}
      forecastData={forecastData}
      selectedHour={selectedHour}
    />
  );
}

function ActivityCheckContent({
  processedData,
  data,
  selectedSpot,
  forecastData,
  selectedHour,
}: {
  processedData: NonNullable<ReturnType<typeof processData>>;
  data: MarineWeatherData | undefined;
  selectedSpot: SpotLocation;
  forecastData: ForecastData | undefined;
  selectedHour: Date;
}) {
  const c = useTheme();
  const actividad = useRatings(
    processedData,
    selectedSpot.name,
    selectedSpot.orientation ?? 90,
    selectedSpot,
    data,
    forecastData,
    selectedHour,
  );
  const safety = useCurrentSafety(data, forecastData, selectedSpot, selectedHour);
  const lifeguard = getLifeguardStatus(selectedHour);
  const iconProps = { size: 20, color: c.secondaryForeground };

  return (
    <View style={{ gap: 16 }}>
      {(safety.color === "red" || safety.color === "yellow") && (
        <View style={[styles.alert, { borderColor: c.destructive + "33", backgroundColor: c.destructive + "0d" }]}>
          <CircleAlert size={20} color={c.destructive} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>{safety.label}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{safety.message}</Text>
          </View>
        </View>
      )}
      {lifeguard === "outside-hours" && (
        <View style={[styles.alert, { borderColor: c.warning + "55", backgroundColor: c.warning + "1a" }]}>
          <ShieldOff size={20} color={c.warning} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontSize: 14, fontWeight: "500" }}>
              Sin guardavidas a las {selectedHour.getHours()}:00hs
            </Text>
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>Horario de guardavidas: {LIFEGUARD_HOURS_LABEL}</Text>
          </View>
        </View>
      )}
      <ActivityCard activity="Nado en aguas abiertas" icon={<SwimIcon {...iconProps} />} rating={actividad.activities.swimming} />
      <ActivityCard activity="Sup tradicional" icon={<SupIcon {...iconProps} />} rating={actividad.activities.sup} />
      <ActivityCard activity="Surf y SupSurf" icon={<Waves {...iconProps} />} rating={actividad.activities.surf} />
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16 },
});
