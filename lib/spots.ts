import type { SpotLocation } from "./types";

export const DEFAULT_SPOTS: SpotLocation[] = [

  // {
  //   name: "Costanera Comodoro",
  //   latitude: -45.86,
  //   longitude: -67.47,
  //   orientation: 90,
  //   country: "Argentina",
  //   exposed: false,
  //   swellWindow: { min: 60, max: 110 },
  //   windShelter: { min: 200, max: 320 }
  // },

  // {
  //   name: "Rada Tilly",
  //   latitude: -45.92,
  //   longitude: -67.55,
  //   orientation: 90,
  //   country: "Argentina",
  //   exposed: false,
  //   swellWindow: { min: 50, max: 120 },
  //   windShelter: { min: 210, max: 310 }
  // },

  // {
  //   name: "Km 3",
  //   latitude: -45.83,
  //   longitude: -67.46,
  //   orientation: 100,
  //   country: "Argentina",
  //   exposed: true,
  //   swellWindow: { min: 40, max: 130 }
  // },

  // {
  //   name: "Restinga Alí",
  //   latitude: -45.81,
  //   longitude: -67.44,
  //   orientation: 90,
  //   country: "Argentina",
  //   exposed: true,
  //   swellWindow: { min: 40, max: 130 }
  // },
  {
  name: "Costanera Comodoro",
  latitude: -45.860,        // ✓ correcto
  longitude: -67.474,       // ajuste mínimo (antes -67.47)
  orientation: 95,          // antes 90° — en ese tramo la costa tuerce, mira levemente al ESE
  country: "Argentina",
  exposed: false,           // ✓ correcto — escolleras y puerto generan abrigo
  swellWindow: { min: 60, max: 115 },  // antes 60-110 — techo sube a 115° por el ESE
  windShelter: { min: 200, max: 320 }  // ✓ sin cambios, rango coherente
},

{
  name: "Rada Tilly",
  latitude: -45.943,        // antes -45.92 — corregido a la playa real (~2.3km al sur)
  longitude: -67.556,       // antes -67.55 — ajuste fino
  orientation: 100,         // antes 90° — Rada Tilly mira más al ESE real
  country: "Argentina",
  exposed: false,           // ✓ correcto — bahía con algo de abrigo natural
  swellWindow: { min: 55, max: 130 }, // antes 50-120 — ajustado al frente ESE real
  windShelter: { min: 200, max: 320 } // antes 210-310 — ampliado igual que Costanera
},

{
  name: "Km 3",
  latitude: -45.830,        // ✓ razonable para zona norte
  longitude: -67.460,       // ✓ razonable
  orientation: 75,          // antes 100° — en ese tramo más al norte la costa mira más al NE
  country: "Argentina",
  exposed: true,            // ✓ correcto
  swellWindow: { min: 30, max: 115 }, // antes 40-130 — piso baja (más fetch NNE), techo baja (sombra al SE)
},

{
  name: "Restinga Alí",
  latitude: -45.799,        // antes -45.81 — corregido al barrio real
  longitude: -67.417,       // antes -67.44 — corregido (~2km al este)
  orientation: 70,          // antes 90° — es el punto más al norte, costa mira más al NNE
  country: "Argentina",
  exposed: true,            // ✓ correcto
  swellWindow: { min: 20, max: 110 }, // antes 40-130 — piso baja por fetch NNE, techo baja
},
 {
  name: "Caleta Córdova",
  latitude: -45.742,        
  longitude: -67.379,     
  orientation: 65,          
  exposed: true,         
  swellWindow: { min: 20, max: 110 },  
                                        
                                        
  windShelter: { min: 200, max: 320 }  
}
]
// // --- Chubut / Río Negro ---
// { name: "Puerto Madryn", latitude: -42.76, longitude: -65.03, orientation: 80, country: "Argentina" },
// { name: "Playa Unión", latitude: -43.33, longitude: -65.03, orientation: 90, country: "Argentina" },
// { name: "Las Grutas", latitude: -40.81, longitude: -65.08, orientation: 160, country: "Argentina" },
// { name: "El Cóndor", latitude: -41.05, longitude: -62.83, orientation: 135, country: "Argentina" },

// // --- Provincia de Buenos Aires ---
// { name: "Mar del Plata", latitude: -38.00, longitude: -57.55, orientation: 85, country: "Argentina" },
// { name: "Villa Gesell", latitude: -37.26, longitude: -56.97, orientation: 90, country: "Argentina" },
// { name: "Pinamar", latitude: -37.10, longitude: -56.86, orientation: 90, country: "Argentina" },
// { name: "Necochea", latitude: -38.55, longitude: -58.74, orientation: 150, country: "Argentina" },
// { name: "Miramar", latitude: -38.26, longitude: -57.84, orientation: 140, country: "Argentina" },
// { name: "Monte Hermoso", latitude: -38.98, longitude: -61.29, orientation: 180, country: "Argentina" },

// // --- Santa Cruz / Tierra del Fuego ---
// { name: "Puerto Deseado", latitude: -47.75, longitude: -65.89, orientation: 110, country: "Argentina" },
// { name: "Río Gallegos", latitude: -51.62, longitude: -69.21, orientation: 90, country: "Argentina" },
// { name: "Ushuaia", latitude: -54.80, longitude: -68.30, orientation: 160, country: "Argentina" }

