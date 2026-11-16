// Modo sin conexión: cada pronóstico que se baja bien se guarda en el celular.
// Si después no hay señal (típico en la playa), se usa el último guardado y se avisa de cuándo es.
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "olitas_cache_";
// Más viejo que esto ya no sirve como pronóstico
const MAX_AGE_MS = 3 * 24 * 3_600_000;

type Kind = "marine" | "forecast";

export interface CachedResult<T> {
  data: T;
  /** null si los datos son frescos; la hora en que se guardaron si vienen del caché */
  offlineSince: Date | null;
}

const key = (kind: Kind, lat: number, lon: number) => `${PREFIX}${kind}_${lat.toFixed(3)}_${lon.toFixed(3)}`;

// JSON convierte las fechas en texto: las volvemos a Date en los arrays de tiempos
function reviveTimes<T>(data: T): T {
  const d = data as { hourly?: { time?: unknown[] }; daily?: { time?: unknown[] } };
  for (const block of [d.hourly, d.daily]) {
    if (block?.time) block.time = block.time.map(t => new Date(t as string));
  }
  return data;
}

async function save(kind: Kind, lat: number, lon: number, data: unknown) {
  try {
    await AsyncStorage.setItem(key(kind, lat, lon), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {}
}

async function load<T>(kind: Kind, lat: number, lon: number): Promise<{ data: T; savedAt: Date } | null> {
  try {
    const raw = await AsyncStorage.getItem(key(kind, lat, lon));
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw) as { savedAt: number; data: T };
    if (Date.now() - savedAt > MAX_AGE_MS) return null;
    return { data: reviveTimes(data), savedAt: new Date(savedAt) };
  } catch {
    return null;
  }
}

/** Pide los datos; si falla (sin señal), devuelve los últimos guardados para ese lugar */
export async function fetchWithOfflineCache<T>(
  kind: Kind,
  lat: number,
  lon: number,
  fetcher: () => Promise<T>,
): Promise<CachedResult<T>> {
  try {
    const data = await fetcher();
    save(kind, lat, lon, data);
    return { data, offlineSince: null };
  } catch (error) {
    const cached = await load<T>(kind, lat, lon);
    if (cached) return { data: cached.data, offlineSince: cached.savedAt };
    throw error;
  }
}
