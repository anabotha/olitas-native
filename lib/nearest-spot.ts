import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { SPOT_STORAGE_KEY } from "@/lib/storage";

export const USE_LOCATION_KEY = "olitas_use_location";

// Distancia en km entre dos coordenadas (fórmula de haversine)
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export interface NearestSpot {
  spot: SpotLocation;
  distanceKm: number;
}

export function findNearestSpotWithDistance(latitude: number, longitude: number, spots = DEFAULT_SPOTS): NearestSpot {
  let nearest = spots[0];
  let min = Infinity;
  for (const spot of spots) {
    const d = distanceKm(latitude, longitude, spot.latitude, spot.longitude);
    if (d < min) {
      min = d;
      nearest = spot;
    }
  }
  return { spot: nearest, distanceKm: min };
}

export function findNearestSpot(latitude: number, longitude: number, spots = DEFAULT_SPOTS): SpotLocation {
  return findNearestSpotWithDistance(latitude, longitude, spots).spot;
}

// A menos de esto de una playa consideramos que el usuario "está en la playa"
export const ON_BEACH_KM = 2;

/** Por defecto usamos la ubicación; el usuario lo puede apagar desde el panel */
export async function getUseLocation() {
  try {
    return (await AsyncStorage.getItem(USE_LOCATION_KEY)) !== "false";
  } catch {
    return true;
  }
}

export async function setUseLocation(value: boolean) {
  try {
    await AsyncStorage.setItem(USE_LOCATION_KEY, String(value));
  } catch {}
}

/**
 * Devuelve la playa más cercana a la ubicación del usuario.
 * Con `ask` pide el permiso si todavía no lo dio (solo con la app abierta; en segundo plano
 * no se puede mostrar el diálogo). Devuelve null sin permiso o sin posición.
 */
export async function getNearestSpotFromLocation({ ask = true } = {}): Promise<SpotLocation | null> {
  return (await locateNearestSpot({ ask }))?.spot ?? null;
}

/** Igual que getNearestSpotFromLocation, pero también devuelve a cuántos km está */
export async function locateNearestSpot({ ask = true } = {}): Promise<NearestSpot | null> {
  try {
    const { granted } = ask
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (!granted) return null;
    // La última posición conocida es instantánea; si es de hace más de 10 min (puede que ya
    // no estés ahí) o no hay, pedimos una nueva de precisión media
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 }).catch(() => null)) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return findNearestSpotWithDistance(position.coords.latitude, position.coords.longitude);
  } catch {
    return null;
  }
}

/** Playa guardada (la última que eligió el usuario) */
export async function getSavedSpot(): Promise<SpotLocation | null> {
  try {
    const saved = await AsyncStorage.getItem(SPOT_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SpotLocation) : null;
  } catch {
    return null;
  }
}

/**
 * Playa a usar: la más cercana si está activada la ubicación; si no, la guardada; si no, la primera.
 * `distanceKm` es null si no se usó la ubicación.
 */
export async function resolveSpotWithDistance({ ask = true } = {}): Promise<{ spot: SpotLocation; distanceKm: number | null }> {
  if (await getUseLocation()) {
    const nearest = await locateNearestSpot({ ask });
    if (nearest) return nearest;
  }
  return { spot: (await getSavedSpot()) ?? DEFAULT_SPOTS[0], distanceKm: null };
}

export async function resolveSpot({ ask = true } = {}): Promise<SpotLocation> {
  return (await resolveSpotWithDistance({ ask })).spot;
}
