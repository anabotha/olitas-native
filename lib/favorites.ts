import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";

export const FAVORITES_STORAGE_KEY = "olitas_favorite_spots";

// Para el aviso diario se consulta el pronóstico de cada favorita: con 3 alcanza y no abusamos de la API
export const MAX_FAVORITES = 3;

export async function loadFavoriteNames(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveFavoriteNames(names: string[]) {
  try {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(names));
  } catch {}
}

export async function loadFavoriteSpots(): Promise<SpotLocation[]> {
  const names = await loadFavoriteNames();
  return names.map(n => DEFAULT_SPOTS.find(s => s.name === n)).filter((s): s is SpotLocation => !!s);
}

// Avisa a todos los componentes que usan el hook cuando cambian las favoritas
const listeners = new Set<(names: string[]) => void>();

export function useFavorites() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    loadFavoriteNames().then(setNames);
    listeners.add(setNames);
    return () => {
      listeners.delete(setNames);
    };
  }, []);

  const isFavorite = useCallback((name: string) => names.includes(name), [names]);

  /** Marca o desmarca. Devuelve false si se llegó al máximo y no se pudo agregar. */
  const toggle = useCallback(
    (name: string) => {
      let next: string[];
      if (names.includes(name)) next = names.filter(n => n !== name);
      else if (names.length >= MAX_FAVORITES) return false;
      else next = [...names, name];
      saveFavoriteNames(next);
      listeners.forEach(l => l(next));
      return true;
    },
    [names],
  );

  return { favorites: names, isFavorite, toggle, isFull: names.length >= MAX_FAVORITES };
}
