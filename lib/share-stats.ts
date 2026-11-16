import type { ForecastData, MarineWeatherData } from "@/lib/types";

const nearestIndex = (times: Date[], target: Date) => {
  let best = -1, min = Infinity;
  times.forEach((t, i) => {
    const d = Math.abs(new Date(t).getTime() - target.getTime());
    if (d < min) { min = d; best = i; }
  });
  return best;
};

// Olas, viento y temperatura a una hora dada, para la imagen de la historia
export const statsAt = (data: MarineWeatherData, forecast: ForecastData | undefined, date: Date) => {
  const i = nearestIndex(data.hourly.time, date);
  const wave = data.hourly.wave_height?.[i] ?? data.hourly.swell_wave_height?.[i];
  const f = forecast ? nearestIndex(forecast.hourly.time, date) : -1;
  const wind = f >= 0 ? forecast!.hourly.wind_speed_10m?.[f] : undefined;
  const temp = f >= 0 ? forecast!.hourly.temperature_2m?.[f] : undefined;
  return [
    { label: "Olas", value: wave != null ? `${wave.toFixed(1)} m` : "–" },
    { label: "Viento", value: wind != null ? `${Math.round(wind)} km/h` : "–" },
    { label: "Temp", value: temp != null ? `${Math.round(temp)}°` : "–" },
  ];
};

/** "hoy 18 h" / "mañana 7 h" / "pasado mañana 9 h" para una hora puntual */
export function hourLabel(date: Date, now = new Date()) {
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  );
  const day = diff === 0 ? "hoy" : diff === 1 ? "mañana" : diff === 2 ? "pasado mañana" : "ayer";
  return `${day} ${date.getHours()} h`;
}
