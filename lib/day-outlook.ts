// Evalúa un día completo (horas de luz) con la misma lógica de puntajes de la app,
// para decidir el aviso diario: ¿hay una ventana buena? ¿hay viento peligroso?
import { useRatings } from "@/hooks/use-ratings";
import type { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import type { NotifActivity } from "./notification-prefs";

// Mismas horas de luz que usan las "Posibles ventanas"
const FIRST_HOUR = 6;
const LAST_HOUR = 20;

// Puntaje desde el que avisamos "buenísimo" (7+ = "Muy bueno" / "Excelente")
export const GOOD_SCORE = 7;
// Viento o ráfagas desde los que avisamos "jodidísimo para tabla" (km/h)
export const DANGER_WIND_KMH = 50;

export interface DayWindow {
  activity: NotifActivity;
  score: number;
  start: Date;
  end: Date;
}

export interface DayOutlook {
  best: DayWindow | null; // mejor ventana entre las actividades pedidas
  maxWind: number; // máximo entre viento medio y ráfagas, en horas de luz
}

// Los ratings son funciones puras aunque el nombre empiece con "use"
const rate = useRatings;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function evaluateDay(
  day: Date,
  spot: SpotLocation,
  data: MarineWeatherData,
  forecast: ForecastData | undefined,
  activities: NotifActivity[],
): DayOutlook {
  // Puntaje por hora y actividad
  const hours: { date: Date; scores: Record<NotifActivity, number> }[] = [];
  for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
    const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h);
    const { activities: r } = rate(null, spot.name, spot.orientation ?? 90, spot, data, forecast, date);
    hours.push({ date, scores: { surf: r.surf.score, sup: r.sup.score, swimming: r.swimming.score } });
  }

  // Mejor ventana: hora con más puntaje + horas contiguas con a lo sumo 1 punto menos
  let best: DayWindow | null = null;
  for (const activity of activities) {
    let bi = -1;
    hours.forEach((h, i) => {
      if (bi === -1 || h.scores[activity] > hours[bi].scores[activity]) bi = i;
    });
    if (bi === -1) continue;
    const score = hours[bi].scores[activity];
    if (best && score <= best.score) continue;
    let from = bi, to = bi;
    while (from > 0 && hours[from - 1].scores[activity] >= score - 1) from--;
    while (to < hours.length - 1 && hours[to + 1].scores[activity] >= score - 1) to++;
    best = { activity, score, start: hours[from].date, end: hours[to].date };
  }

  // Viento máximo de día (medio o ráfagas)
  let maxWind = 0;
  if (forecast) {
    forecast.hourly.time.forEach((t, i) => {
      const d = new Date(t);
      if (!sameDay(d, day) || d.getHours() < FIRST_HOUR || d.getHours() > LAST_HOUR) return;
      const wind = Math.max(forecast.hourly.wind_speed_10m?.[i] ?? 0, forecast.hourly.wind_gusts_10m?.[i] ?? 0);
      if (wind > maxWind) maxWind = wind;
    });
  }

  return { best, maxWind: Math.round(maxWind) };
}
