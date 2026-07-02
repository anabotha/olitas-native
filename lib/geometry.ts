// Helpers geométricos compartidos entre use-processData.ts y use-ratings.ts.
// Antes estaban duplicados (y el angleDiff divergía entre archivos: uno
// normalizaba los ángulos de entrada y el otro no). Fuente única acá.

/**
 * Diferencia angular más corta entre dos rumbos, en el rango 0–180.
 * Normaliza las entradas a 0–359 antes de comparar, así funciona con
 * ángulos negativos o mayores a 360.
 */
export const angleDiff = (angle1: number, angle2: number): number => {
  const a = (angle1 % 360 + 360) % 360;
  const b = (angle2 % 360 + 360) % 360;
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
};

/**
 * Indica si `angle` cae dentro de la ventana [min, max], soportando
 * ventanas que cruzan el 0 (ej. min=200, max=320 o min=350, max=20).
 */
export const inAngleWindow = (angle: number, min: number, max: number): boolean => {
  if (min <= max) return angle >= min && angle <= max;
  return angle >= min || angle <= max;
};

export interface WindClassification {
  /** Diferencia entre el rumbo hacia el que sopla el viento y la orientación del spot (0–180). */
  diff: number;
  isDirectOnshore: boolean;
  isOnshore: boolean;
  isOffshore: boolean;
  isCross: boolean;
  isSideShore: boolean;
}

/**
 * Clasifica el viento respecto a la orientación del spot.
 *
 * Convención: `orientation` es el rumbo hacia el que mira la playa. Se compara
 * contra la dirección *hacia la que sopla* el viento (windDirection + 180),
 * porque las APIs meteorológicas reportan la dirección *de donde viene*.
 *
 * Umbrales (idénticos a los que estaban inline en cada rating):
 *   diff < 22.5  → onshore directo
 *   diff < 45    → onshore
 *   diff > 135   → offshore
 *   45–135       → cross / sideshore
 */
export const classifyWind = (windDirection: number, orientation = 90): WindClassification => {
  const windBlowingToward = (windDirection + 180) % 360;
  const diff = angleDiff(windBlowingToward, orientation);
  const isOnshore = diff < 45;
  const isOffshore = diff > 135;
  return {
    diff,
    isDirectOnshore: diff < 22.5,
    isOnshore,
    isOffshore,
    isCross: !isOnshore && !isOffshore,
    isSideShore: diff >= 45 && diff <= 135,
  };
};
