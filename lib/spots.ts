import type { SpotLocation } from "./types";

// optimalTide: ventana de marea preferida (0 = baja, 1 = alta). Los valores de
// abajo son HEURÍSTICOS — ajustalos con conocimiento local de cada spot.

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
  optimalTide: { min: 0.4, max: 0.75 }, // playa protegida → media
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
  optimalTide: { min: 0.5, max: 0.9 },  // playa muy plana, gran amplitud → necesita agua, media-alta
},

{
  name: "Km 3",
  latitude: -45.830,
  longitude: -67.460,
  orientation: 75,
  country: "Argentina",
  exposed: true,
  swellWindow: { min: 30, max: 115 },
  optimalTide: { min: 0.4, max: 0.8 },  // beach expuesta → media
},

{
  name: "Restinga Alí",
  latitude: -45.799,
  longitude: -67.417,
  orientation: 70,
  country: "Argentina",
  exposed: true,
  swellWindow: { min: 20, max: 110 },
  optimalTide: { min: 0.55, max: 0.95 }, // restinga (roca) → alta cubre la restinga
},
 {
  name: "Caleta Córdova",
  latitude: -45.742,
  longitude: -67.379,
  orientation: 65,
  exposed: true,
  swellWindow: { min: 20, max: 110 },
  windShelter: { min: 200, max: 320 },
  optimalTide: { min: 0.35, max: 0.75 }, // caleta/punta → suele andar de baja a media
}
]
