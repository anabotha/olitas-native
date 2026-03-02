"use client"

import { ActivityRating, CombinedConditions, MarineWeatherData, ActivityType } from "@/lib/types"
import { useMemo } from "react"

export const processData = (data?: MarineWeatherData, beachOrientation?: number): CombinedConditions | null => {
    if (!data) return null;
    const getTime = (date: Date) => {
        return date.toISOString().split("T")[1].split(":")[0]
    }
    const getDate = (date: Date) => {
        return date.toISOString().split("T")[0]
    }

    const searchTodaysStats = () => {
        if (!data) return null

        const today = getDate(new Date())
        const now = getTime(new Date())
        const index = data.daily.time.findIndex(
            (date) => getDate(date) === today
        )
        const hourly = data.hourly.time.findIndex((time) => getTime(time) === now)

        if (index === -1) return null

        const processData = {
            wind_wave_height_max: data.daily.wind_wave_height_max?.[index] ?? null,
            wind_wave_direction_dominant:
                data.daily.wind_wave_direction_dominant?.[index] ?? null,
            swell_wave_period_max:
                data.daily.swell_wave_period_max?.[index] ?? null,
            swell_wave_direction_dominant:
                data.daily.swell_wave_direction_dominant?.[index] ?? null,
            wave_height: data.hourly.wave_height?.[hourly] ?? null,
            wave_direction: data.hourly.wave_direction?.[hourly] ?? null,
            swell_wave_height: data.hourly.swell_wave_height?.[hourly] ?? null,
            swell_wave_direction: data.hourly.swell_wave_direction?.[hourly] ?? null,
            swell_wave_period: data.hourly.swell_wave_peak_period?.[hourly] ?? null,
            wind_wave_period: data.hourly.wind_wave_period?.[hourly] ?? null,
            wind_wave_direction: data.hourly.wind_wave_direction?.[hourly] ?? null,
        }

        return processData ? processData : null;
    }

    const getLabel = (score: number): Partial<ActivityRating> => {
        if (score < 2) {
            return {
                label: "Poor",
                description: "Condiciones no aptas para esta actividad.",
            }
        }
        if (score < 4) {
            return {
                label: "Fair",
                description: "Normalito, podria estar mejor.",
            }
        }
        if (score < 6) {
            return {
                label: "Good",
                description: "Condiciones buenas para esta actividad.",
            }
        }
        if (score < 8) {
            return {
                label: "Great",
                description: "Condiciones muy buenas para esta actividad.",
            }
        }
        return {
            label: "Epic",
            description: "Esta ideal",
        }
    }
    const getRating = (
        data: CombinedConditions,
        activity: ActivityType
    ): ActivityRating | null => {

        switch (activity) {
            case "surf": {
                const { score, factors } = getSurfRating(data);
                return { ...getLabel(score), factors };
            }

            case "sup": {
                const { score, factors } = getSupRating(data);
                return { ...getLabel(score), factors };
            }

            case "swimming": {
                const { score, factors } = getSwimmingRating(data);
                return { ...getLabel(score), factors };
            }
            default: {
                return null;
            }
        }
    };
    // Normaliza diferencias de ángulos a 0–180
    const angleDiff = (a: number, b: number) => {
        let diff = Math.abs(a - b);
        return diff > 180 ? 360 - diff : diff;
    };

    // Determina condición del viento y si genera corderito
    const evaluateWind = (windDir: number, beachDir: number, waveDir?: number, swellDir?: number, windSpeed?: number) => {
        const diff = angleDiff(windDir, beachDir);

        let windCond: "offshore" | "onshore" | "crossshore";
        if (diff > 120) windCond = "offshore";
        else if (diff < 60) windCond = "onshore";
        else windCond = "crossshore";

        // Determinar corderito solo si se pasan direcciones de ola y swell
        let corderitoFlag = false;
        if (waveDir !== undefined && swellDir !== undefined && windSpeed !== undefined) {
            const swellDiff = angleDiff(waveDir, swellDir);
            corderitoFlag = swellDiff > 120 && windSpeed > 15;
        }

        return { windCond, corderito: corderitoFlag };
    };

    // Rating de Surf
    const getSurfRating = (stats: any, beachOrientation = 90) => {
        const { waveHeight, swellPeriod, windSpeed, windDirection, waveDirection, swellDirection } = stats;
        let score = 0;
        let factors: string[] = [];

        const { windCond, corderito: hayCorderito } = evaluateWind(
            windDirection,
            beachOrientation,
            waveDirection,
            swellDirection,
            windSpeed
        );

        // Swell y período
        if (swellPeriod > 10) { score += 4; factors.push("Gran período (mucha fuerza)"); }
        else if (swellPeriod > 7) { score += 2; factors.push("Período aceptable"); }

        // Altura
        if (waveHeight > 0.8 && waveHeight < 2) { score += 3; factors.push("Altura ideal"); }

        // Viento
        if (windCond === "offshore" && windSpeed < 30) {
            score += 5; factors.push("Viento de tierra (limpia la ola)");
        } else if (windCond === "onshore" && hayCorderito) {
            score -= 6; factors.push("Mucho corderito (viento del mar)");
        }

        return { score: Math.max(0, score), factors };
    };

    // Rating de SUP
    const getSupRating = (stats: any, beachOrientation = 90) => {
        const { windSpeed, windDirection, waveHeight } = stats;
        let score = 0;
        let factors: string[] = [];

        const { windCond } = evaluateWind(windDirection, beachOrientation);

        if (windSpeed < 10) { score += 7; factors.push("Casi nada de viento"); }
        else if (windSpeed < 18) { score += 2; factors.push("Viento moderado"); }
        else { score -= 10; factors.push("Mucho viento para SUP"); }

        if (waveHeight < 0.5) { score += 3; factors.push("Mar plato"); }
        else if (waveHeight > 1.2) { score -= 5; factors.push("Mucha ola para equilibrio"); }

        if (windCond === "offshore" && windSpeed < 25) {
            score += 2; factors.push("Viento de tierra mantiene la orilla plana");
        }

        return { score: Math.max(0, score), factors };
    };

    // Rating de Natación
    const getSwimmingRating = (stats: any, beachOrientation = 90) => {
        const { seaTemperature, windSpeed, windDirection, waveHeight } = stats;
        let score = 0;
        let factors: string[] = [];

        const { windCond } = evaluateWind(windDirection, beachOrientation);

        if (seaTemperature && seaTemperature < 13) { score -= 2; factors.push("Agua muy fría (usar neoprene grueso)"); }
        else if (seaTemperature && seaTemperature > 16) { score += 4; factors.push("Temperatura agradable para la zona"); }

        if (waveHeight && waveHeight < 0.6 && windSpeed && windSpeed < 15) { score += 5; factors.push("Condiciones calmas y seguras"); }

        if (windCond === "onshore" && windSpeed && windSpeed > 20) {
            score -= 5; factors.push("Mar picado/Corderito: difícil respirar al nadar");
        }

        return { score: Math.max(0, score), factors };
    };
    return useMemo(() => {
        const todayStats = searchTodaysStats();
        if (!todayStats) return null;

        const processedData = {
            current: {
                waveHeight: todayStats.wave_height ?? undefined,
                waveDirection: todayStats.wave_direction ?? undefined,
                wavePeriod: todayStats.wind_wave_period ?? undefined,

                swellHeight: todayStats.swell_wave_height ?? undefined,
                swellDirection: todayStats.swell_wave_direction ?? undefined,
                swellPeriod: todayStats.swell_wave_period ?? undefined,

                windDirection:
                    todayStats.wind_wave_direction ??
                    todayStats.wind_wave_direction_dominant ??
                    undefined,

                // No disponibles en marine actual
                windSpeed: undefined,
                windGusts: undefined,
                seaTemperature: undefined,
                airTemperature: undefined,
                weatherCode: undefined,
            },
            activities: {
                surf: getRating(todayStats, "surf"),
                sup: getRating(todayStats, "sup"),
                swimming: getRating(todayStats, "swimming"),
            },
        }
        return processedData;
    }, [data])
}