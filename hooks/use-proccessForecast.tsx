
import { ForecastData } from "@/lib/types"
import { useMemo } from "react"

interface DailySummary {
    dia: string; // "DD/MM/YYYY"
    uvIndex: number;
}

export interface HourlySummary {
    hora: string; // "HH:00"
    temperatura_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    humedad: number;
    apparent_temperature: number;
    time: string;
    fecha: string;
    wind_gusts_10m: number;
    weatherCode: number;
}

/** Inicio de la hora (minutos y segundos en cero) para comparar fechas completas */
export const inicioDeHora = (fecha: Date | string): number => {
    const d = new Date(fecha);
    d.setMinutes(0, 0, 0);
    return d.getTime();
};

/** Fecha local "YYYY-MM-DD" (toISOString usaría UTC y corre el día 3 horas) */
const fechaLocal = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export interface ProcessedForecast {
    hoy: HourlySummary[];
    semana: DailySummary[]
    ;
    mañana: HourlySummary[]
    ;

}

export const useProcessForecast = (data?: ForecastData): ProcessedForecast | null => {
    if (!data) return null;

    const formatDate = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date;
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const formatHour = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date;
        return `${String(d.getHours()).padStart(2, "0")}:00`;
    };

    // Hora a hora para hoy

    const hoyStr = fechaLocal(new Date()); // "2026-03-02"

    const hoy: HourlySummary[] = data.hourly.time
        .map((t, i) => {
            const date = new Date(t);
            return {
                hora: formatHour(date), // o formatHour(t)
                temperatura_2m: data.hourly.temperature_2m[i],
                wind_speed_10m: data.hourly.wind_speed_10m[i],
                wind_direction_10m: data.hourly.wind_direction_10m[i],
                humedad: data.hourly.relative_humidity_2m[i],
                fecha: fechaLocal(date), // fecha local, no UTC
                apparent_temperature: data.hourly.apparent_temperature[i],
                wind_gusts_10m: data.hourly.wind_gusts_10m[i],
                weatherCode: data.hourly.weather_code[i],
                time: t instanceof Date ? t.toISOString() : t,
            };
        })
        .filter(h => h.fecha === hoyStr);
    const ahora = new Date();
    const mña = new Date(ahora);
    mña.setDate(ahora.getDate() + 1);

    const mñaStr = fechaLocal(mña);

    const mañana: HourlySummary[] = data.hourly.time
        .map((t, i) => {
            const date = new Date(t);
            return {
                hora: formatHour(date), // o formatHour(t)
                temperatura_2m: data.hourly.temperature_2m[i],
                wind_speed_10m: data.hourly.wind_speed_10m[i],
                wind_direction_10m: data.hourly.wind_direction_10m[i],
                humedad: data.hourly.relative_humidity_2m[i],
                fecha: fechaLocal(date), // fecha local, no UTC
                apparent_temperature: data.hourly.apparent_temperature[i],
                wind_gusts_10m: data.hourly.wind_gusts_10m[i],
                weatherCode: data.hourly.weather_code[i],
                time: t instanceof Date ? t.toISOString() : t,
            }
        })
        .filter(h => h.fecha === mñaStr);
    // Resumen diario de la semana
    const semana: DailySummary[] = data.daily.time.map((t, i) => ({
        dia: formatDate(t),
        uvIndex: data.daily.uv_index_max[i],
    }));

    return { hoy, mañana, semana };
};

// Auxiliar para convertir hora de daily/hourly a Date si viene como string
const horarioToDate = (t: Date | string) => (typeof t === "string" ? new Date(t) : t);