import AsyncStorage from "@react-native-async-storage/async-storage";
import { MapPin } from "lucide-react-native";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import { SPOT_STORAGE_KEY } from "@/lib/storage";
import { Picker } from "./Picker";

export function SpotSelector({
  selectedSpot,
  onSelectSpot,
}: {
  selectedSpot: SpotLocation;
  onSelectSpot: (spot: SpotLocation) => void;
}) {
  const c = useTheme();
  return (
    <Picker
      title="Elegí tu playa"
      searchable
      icon={<MapPin size={16} color={c.primary} />}
      selectedKey={selectedSpot.name}
      options={DEFAULT_SPOTS.map(spot => ({
        key: spot.name,
        label: spot.name,
        sublabel: spot.country,
        value: spot,
      }))}
      onSelect={spot => {
        AsyncStorage.setItem(SPOT_STORAGE_KEY, JSON.stringify(spot)).catch(() => {});
        onSelectSpot(spot);
      }}
    />
  );
}
