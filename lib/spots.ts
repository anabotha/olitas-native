import type { SpotLocation } from "./types";

// optimalTide: ventana de marea preferida (0 = baja, 1 = alta), en el espacio
// normalizado que devuelve getTidalPhase (ver SPOT_TIDAL_CONFIG en
// hooks/use-processData.ts, que reescala esa curva por spot).
//
// Estos valores son HEURÍSTICOS, a ojo, basados en la experiencia de caminar
// cada playa — NO en una tabla de marea real ni en un modelo físico. Estado
// de calibración por spot (ver detalle de cada uno abajo):
//   - Costanera Comodoro: ajustada a partir de una descripción concreta
//     (cuántos metros de playa quedan en baja/alta). El resto todavía no.
//   - Rada Tilly, Km 3, Restinga Alí, Caleta Córdova: valores de arranque,
//     sin confirmar contra la experiencia real en la playa.
//
// Para recalibrar un spot: la señal más útil es "cuántos metros de playa
// quedan para caminar" en baja normal / baja extrema / alta, y en qué punto
// de esa escala rompe mejor la ola. Ver conversación de referencia al pie
// del archivo para el detalle de cómo se dedujo el valor de Costanera.

export const DEFAULT_SPOTS: SpotLocation[] = [

  {
  name: "Costanera Comodoro",
  latitude: -45.860,
  longitude: -67.474,
  orientation: 95,
  country: "Argentina",
  exposed: false,
  swellWindow: { min: 60, max: 115 },
  windShelter: { min: 200, max: 320 },
  // Playa chica: ~5m de arena en baja normal, ~10m en baja extrema, 0-1m en
  // alta (a veces no queda playa). Lo mejor es media-alta, con 3-4m para
  // caminar — por eso la ventana arranca en 0.55 (media-alta), no en 0.4.
  optimalTide: { min: 0.55, max: 0.8 },
},

{
  name: "Rada Tilly",
  latitude: -45.943,

  longitude: -67.556,
  orientation: 100,
  country: "Argentina",
  exposed: false,
  swellWindow: { min: 55, max: 130 },
  windShelter: { min: 200, max: 320 },
  // Playa muy plana y con mucha amplitud: en baja llega a exponer ~20m de
  // arena (mucho más que el resto de los spots) → necesita agua, media-alta.
  // Sin confirmar con más detalle todavía.
  optimalTide: { min: 0.5, max: 0.9 },
},

{
  name: "Km 3",
  latitude: -45.830,
  longitude: -67.460,
  orientation: 75,
  country: "Argentina",
  exposed: true,
  swellWindow: { min: 30, max: 115 },
  optimalTide: { min: 0.4, max: 0.8 },  // beach expuesta → media. Sin confirmar.
},

{
  name: "Restinga Alí",
  latitude: -45.799,
  longitude: -67.417,
  orientation: 70,
  country: "Argentina",
  exposed: true,
  swellWindow: { min: 20, max: 110 },
  optimalTide: { min: 0.55, max: 0.95 }, // restinga (roca) → alta cubre la restinga. Sin confirmar.
},
 {
  name: "Caleta Córdova",
  latitude: -45.742,
  longitude: -67.379,
  orientation: 65,
  exposed: true,
  swellWindow: { min: 20, max: 110 },
  windShelter: { min: 200, max: 320 },
  // caleta/punta → suele andar de baja a media. Playa corta en longitud
  // (perfil bajito), así que capaz cambia poco entre mareas — no hay
  // suficiente certeza todavía para tocar el número.
  optimalTide: { min: 0.35, max: 0.75 },
}
]
