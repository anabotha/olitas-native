import type { ActivityRating, CombinedConditions } from "./types";




export function getWindDirectionLabel(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index];
}

export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna leve",
    53: "Llovizna",
    55: "Llovizna intensa",
    61: "Lluvia leve",
    63: "Lluvia",
    65: "Lluvia intensa",
    71: "Nevada leve",
    73: "Nevada",
    75: "Nevada intensa",
    80: "Chaparrones leves",
    81: "Chaparrones",
    82: "Chaparrones fuertes",
    95: "Tormenta",
    96: "Tormenta con granizo",
    99: "Tormenta con granizo fuerte",
  };
  return descriptions[code] || "Sin datos";
}
