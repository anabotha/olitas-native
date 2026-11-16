// Datos del widget de inicio: la mejor ventana de las próximas horas en la playa actual.
// El widget solo existe en la app compilada para iOS; en Expo Go, Android y web esto no hace nada.
import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import { useRatings } from "@/hooks/use-ratings";
import { getMarineWeather } from "@/lib/api/getMarineWeather";
import { getForecast } from "@/lib/api/getForecast";
import { fetchWithOfflineCache } from "@/lib/offline-cache";
import { resolveSpot } from "@/lib/nearest-spot";
import { capitalize, goodPhrase } from "@/lib/phrases";
import type { OlitasWidgetProps } from "@/widgets/OlitasWidget";

type WidgetHandle = { updateSnapshot: (props: OlitasWidgetProps) => void };

// En Expo Go el módulo nativo no existe: antes de cargar el widget preguntamos si está
// (requireOptionalNativeModule devuelve null en vez de tirar error), así ni se intenta.
let widget: WidgetHandle | null | undefined;
function getWidget(): WidgetHandle | null {
  if (widget !== undefined) return widget;
  if (Platform.OS !== "ios" || !requireOptionalNativeModule("ExpoWidgets")) return (widget = null);
  try {
    widget = require("@/widgets/OlitasWidget").default as WidgetHandle;
  } catch {
    widget = null;
  }
  return widget;
}

const ACTIVITIES = [
  { key: "surf", verb: "surfear", symbol: "figure.surfing" },
  { key: "sup", verb: "hacer SUP", symbol: "oar.2.crossed" },
  { key: "swimming", verb: "nadar", symbol: "figure.pool.swim" },
] as const;

const label = (score: number) => (score <= 6 ? "Bien" : score <= 8 ? "Muy bueno" : "Excelente");

const when = (start: Date, end: Date) => {
  const today = new Date();
  const dayDiff = Math.round(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86_400_000,
  );
  const day = dayDiff === 0 ? "Hoy" : "Mañana";
  return start.getTime() === end.getTime() ? `${day} ${start.getHours()} h` : `${day} ${start.getHours()}–${end.getHours()} h`;
};

/** Recalcula y actualiza el widget (no hace nada si no hay widget) */
export async function refreshHomeWidget() {
  const w = getWidget();
  if (!w) return;

  const spot = await resolveSpot({ ask: false });
  const [data, forecast] = await Promise.all([
    fetchWithOfflineCache("marine", spot.latitude, spot.longitude, () => getMarineWeather(spot.latitude, spot.longitude)).then(r => r.data),
    fetchWithOfflineCache("forecast", spot.latitude, spot.longitude, () => getForecast(spot.latitude, spot.longitude))
      .then(r => r.data)
      .catch(() => undefined),
  ]);
  // Mismo cálculo que "Posibles ventanas" (próximas 24 h, horas de luz)
  const { bestWindows } = useRatings(null, spot.name, spot.orientation ?? 90, spot, data, forecast, new Date());

  const top = ACTIVITIES.map(a => ({ ...a, w: bestWindows?.[a.key] }))
    .filter(a => a.w?.date && a.w.score > 5)
    .sort((a, b) => b.w!.score - a.w!.score)[0];

  const now = new Date();
  const updated = `Actualizado ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  w.updateSnapshot(
    top
      ? {
          spot: spot.name,
          headline: capitalize(goodPhrase(top.verb)),
          detail: `${when(top.w!.start ?? top.w!.date!, top.w!.end ?? top.w!.date!)} · ${label(top.w!.score)}`,
          symbol: top.symbol,
          updated,
        }
      : {
          spot: spot.name,
          headline: "Nada destacable",
          detail: "en las próximas horas",
          symbol: "water.waves",
          updated,
        },
  );
}
