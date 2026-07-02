// Perillas de calibración por actividad.
//
// Centralizadas acá para poder ajustar el scoring (umbrales de viento, gates
// de swell, reducciones por reparo/exposición, techos de normalización) sin
// tocar la lógica en use-ratings.ts. Los valores son los que ya estaban en el
// código — la recalibración fina es un paso aparte.

export const SURF_CONFIG = {
  maxRaw: 14,               // techo del score crudo antes de normalizar a 0–10
  shelterReduction: 0.6,    // multiplica el viento cuando el spot está protegido
  exposureReduction: 0.85,  // multiplica la altura de swell en spots no expuestos
  swellGate: 0.4,           // por debajo de esto no hay olas surfeables (era 0.3)
  wind: {
    offshoreDanger: 55,     // offshore por encima → hard stop
    extreme: 60,            // cualquier dirección por encima → hard stop
  },
  // Techo de score según la altura de swell (m). En surf el tamaño manda:
  // un viento offshore limpio o un buen período NO pueden hacer surfeable una
  // ola chica. Cada tramo limita el score final sin importar el resto.
  // Ej: 0.3m tope 1 ("Plano"), 0.6m tope 5 ("Bien"), 1.2m+ sin tope real.
  // Se evalúa de mayor a menor: primer tramo cuyo `min` <= altura.
  sizeCap: [
    { min: 1.5, cap: 10 },
    { min: 1.1, cap: 9 },
    { min: 0.8, cap: 7 },
    { min: 0.6, cap: 5 },
    { min: 0.4, cap: 3 },
    { min: 0.0, cap: 1 },
  ],
} as const;

export const SUP_CONFIG = {
  maxRaw: 10,               // el puntaje aditivo ya vive en escala ~0–10
  shelterReduction: 0.65,
  exposureReduction: 0.6,   // se aplica a la ola de referencia (inestabilidad)
  glassy: { maxWind: 12, maxWave: 0.25 },
  hardStop: {
    extreme: 55,
    danger: 45,
    strong: 40,
    offshoreDanger: 34,
  },
} as const;

export const SWIM_CONFIG = {
  base: 5,                  // punto de partida del score aditivo
  shelterReduction: 0.65,
  exposureReduction: 0.6,
  glassyMaxWind: 5,
  hardStop: {
    orange: 60,
    extreme: 55,
    veryStrong: 45,
    offshoreDanger: 28,
    advanced: 35,
  },
} as const;
