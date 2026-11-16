import { Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MapPin, Star } from "lucide-react-native";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import { SPOT_STORAGE_KEY } from "@/lib/storage";
import { MAX_FAVORITES, useFavorites } from "@/lib/favorites";
import { Picker } from "./Picker";

const STAR_COLOR = "#f5a524";

export function SpotSelector({
  selectedSpot,
  onSelectSpot,
}: {
  selectedSpot: SpotLocation;
  onSelectSpot: (spot: SpotLocation) => void;
}) {
  const c = useTheme();
  const { isFavorite, toggle, isFull } = useFavorites();

  // Favoritas primero, el resto en el orden de siempre
  const spots = [...DEFAULT_SPOTS].sort((a, b) => Number(isFavorite(b.name)) - Number(isFavorite(a.name)));

  return (
    <Picker
      title="Elegí tu playa"
      searchable
      icon={<MapPin size={16} color={c.primary} />}
      selectedKey={selectedSpot.name}
      options={spots.map(spot => ({
        key: spot.name,
        label: spot.name,
        sublabel: isFavorite(spot.name) ? `★ Favorita · ${spot.country ?? ""}` : spot.country,
        value: spot,
      }))}
      renderTrailing={option => {
        const fav = isFavorite(option.key);
        const disabled = !fav && isFull;
        return (
          <Pressable
            onPress={() => toggle(option.key)}
            disabled={disabled}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              fav
                ? `Quitar ${option.key} de favoritas`
                : disabled
                  ? `Máximo ${MAX_FAVORITES} favoritas`
                  : `Agregar ${option.key} a favoritas`
            }
            style={{ padding: 4, opacity: disabled ? 0.3 : 1 }}
          >
            <Star size={20} color={fav ? STAR_COLOR : c.mutedForeground} fill={fav ? STAR_COLOR : "transparent"} />
          </Pressable>
        );
      }}
      onSelect={spot => {
        AsyncStorage.setItem(SPOT_STORAGE_KEY, JSON.stringify(spot)).catch(() => {});
        onSelectSpot(spot);
      }}
    />
  );
}
