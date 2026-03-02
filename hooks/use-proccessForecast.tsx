"use client"

import { ForecastData } from "@/lib/types"
import { useMemo } from "react"

interface DailySummary {
    dia: string; // "DD/MM/YYYY"
    uv_index_max: number;
}

interface HourlySummary {
    hora: string; // "HH:00"
    temperatura_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    humedad: number;
}

interface ProcessedForecast {
    hoy: HourlySummary[] | null;
    semana: DailySummary[] | null;
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

    const hoyStr = new Date().toISOString().split("T")[0]; // "2026-03-02"

    const hoy: HourlySummary[] = data.hourly.time
        .map((t, i) => {
            const date = new Date(t);
            return {
                hora: formatHour(date), // o formatHour(t)
                temperatura_2m: data.hourly.temperature_2m[i],
                wind_speed_10m: data.hourly.wind_speed_10m[i],
                wind_direction_10m: data.hourly.wind_direction_10m[i],
                humedad: data.hourly.relative_humidity_2m[i],
                fecha: date.toISOString().split("T")[0], // agregamos la fecha para filtrar
            };
        })
        .filter(h => h.fecha === hoyStr);

    // Resumen diario de la semana
    const semana: DailySummary[] = data.daily.time.map((t, i) => ({
        dia: formatDate(t),
        uv_index_max: data.daily.uv_index_max[i],
    }));

    return { hoy, semana };
};

// Auxiliar para convertir hora de daily/hourly a Date si viene como string
const horarioToDate = (t: Date | string) => (typeof t === "string" ? new Date(t) : t);