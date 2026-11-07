// Horario de guardavidas: igual para todos los spots de la ciudad.
// TODO: confirmar horario y fechas reales de la temporada.
export const LIFEGUARD = {
  from: 12, // hora de inicio (24h)
  to: 20, // hora de fin (24h, exclusiva)
  season: { startMonth: 12, endMonth: 3 }, // dic–mar (1 = enero)
};

const MONTHS = ["enero", "febrero", "Marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "Diciembre"];

const pad = (n: number) => String(n).padStart(2, "0");

export const LIFEGUARD_HOURS_LABEL = `${pad(LIFEGUARD.from)}:00 a ${pad(LIFEGUARD.to)}:00`;
export const LIFEGUARD_SEASON_LABEL = `${MONTHS[LIFEGUARD.season.startMonth - 1]} a ${MONTHS[LIFEGUARD.season.endMonth - 1]}`;

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
