// Núcleo de scoring compartido por las tres actividades (surf, SUP, nado).
// Antes cada rating armaba a mano su normalización, sus hard-stops y su
// derivación de peligro; acá vive la versión única.

import { inAngleWindow } from "./geometry";

export type DangerLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "ADVANCED";

export interface RatingResult {
  score: number;
  factors: string[];
  dangerLevel?: DangerLevel;
  isGlassy?: boolean;
  isEpic?: boolean;
}

/** Clampa y redondea un puntaje al rango 0–10. */
export const clampScore = (raw: number): number =>
  Math.round(Math.min(Math.max(0, raw), 10));

/**
 * Normaliza un puntaje aditivo crudo (0..maxRaw) a la escala 0–10.
 * Con maxRaw = 10 equivale a un simple clamp.
 */
export const normalize = (raw: number, maxRaw: number): number =>
  clampScore((raw / maxRaw) * 10);

/** Nivel de peligro derivado del score final (regla usada en natación). */
export const dangerFromScore = (score: number): DangerLevel =>
  score <= 2 ? "HIGH" : score <= 5 ? "MEDIUM" : "LOW";

/** Elimina factores duplicados preservando el orden de aparición. */
export const dedupe = (factors: string[]): string[] => [...new Set(factors)];

/**
 * Puntaje de marea según la preferencia del spot.
 *
 * `normalized` es la posición de la marea en el rango del spot (0 = baja,
 * 1 = alta), tal como la devuelve getTidalPhase. `window` es la franja óptima.
 * Devuelve `maxBonus` dentro de la franja y decae linealmente hasta una
 * penalización suave (piso -1) a medida que la marea se aleja.
 */
export const tideWindowScore = (
  normalized: number,
  window: { min: number; max: number },
  maxBonus = 2,
  falloff = 0.3
): number => {
  const { min, max } = window;
  if (normalized >= min && normalized <= max) return maxBonus;
  const dist = normalized < min ? min - normalized : normalized - max;
  return Math.max(-1, Math.round(maxBonus * (1 - dist / falloff)));
};

/**
 * Aplica el reparo del spot al viento. Devuelve el viento efectivo y si el
 * spot está protegido para la dirección actual. No agrega factores: cada
 * actividad usa un texto distinto ("Spot protegido del viento" / "Viento
 * protegido"), así que el caller decide qué mostrar.
 */
export const applyShelter = (
  windSpeed: number,
  windDirection: number,
  shelter: { min: number; max: number } | undefined,
  reduction: number
): { effectiveWind: number; sheltered: boolean } => {
  const sheltered =
    !!shelter && inAngleWindow(windDirection, shelter.min, shelter.max);
  return {
    effectiveWind: sheltered ? windSpeed * reduction : windSpeed,
    sheltered,
  };
};
