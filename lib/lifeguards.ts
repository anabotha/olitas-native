// Horario de guardavidas: igual para todos los spots de la ciudad.
// TODO: confirmar horario y fechas reales de la temporada.
export const LIFEGUARD = {
  from: 12, // hora de inicio (24h)
  to: 20, // hora de fin (24h, exclusiva)
  season: { startMonth: 12, endMonth: 3 }, // dic–mar (1 = enero)
};

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const pad = (n: number) => String(n).padStart(2, "0");

export const LIFEGUARD_HOURS_LABEL = `${pad(LIFEGUARD.from)}:00 a ${pad(LIFEGUARD.to)}:00`;

// Último día del mes de cierre (ej. 31 para marzo)
const SEASON_END_DAY = new Date(2001, LIFEGUARD.season.endMonth, 0).getDate();

// "1 dic – 31 mar"
export const LIFEGUARD_SEASON_LABEL = `1 ${MONTHS_SHORT[LIFEGUARD.season.startMonth - 1]} – ${SEASON_END_DAY} ${MONTHS_SHORT[LIFEGUARD.season.endMonth - 1]}`;

// "1 de diciembre"
export const LIFEGUARD_SEASON_START_LABEL = `1 de ${MONTHS[LIFEGUARD.season.startMonth - 1]}`;

// Días enteros desde `date` hasta el próximo inicio de temporada
export function daysUntilSeasonStart(date: Date): number {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let start = new Date(today.getFullYear(), LIFEGUARD.season.startMonth - 1, 1);
  if (start < today) start = new Date(today.getFullYear() + 1, LIFEGUARD.season.startMonth - 1, 1);
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

// Último día de la temporada (para no prometer guardavidas "mañana" el 31/3)
export function isLastSeasonDay(date: Date): boolean {
  return date.getMonth() + 1 === LIFEGUARD.season.endMonth && date.getDate() === SEASON_END_DAY;
}

export type LifeguardStatus = "covered" | "outside-hours" | "off-season";

export function getLifeguardStatus(date: Date): LifeguardStatus {
  const { startMonth, endMonth } = LIFEGUARD.season;
  const month = date.getMonth() + 1;
  const inSeason =
    startMonth <= endMonth ? month >= startMonth && month <= endMonth : month >= startMonth || month <= endMonth;
  if (!inSeason) return "off-season";
  const h = date.getHours();
  return h >= LIFEGUARD.from && h < LIFEGUARD.to ? "covered" : "outside-hours";
}
