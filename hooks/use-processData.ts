"use client"

import { ActivityRating, CombinedConditions, MarineWeatherData, ActivityType } from "@/lib/types"
import { useMemo } from "react"

export const processData = (data?: MarineWeatherData): CombinedConditions | null => {
    if (!data) return null;
    console.log(data);
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
                description: "Conditions are not suitable for this activity.",
            }
        }
        if (score < 4) {
            return {
                label: "Fair",
                description: "Conditions are okay, but could be better.",
            }
        }
        if (score < 6) {
            return {
                label: "Good",
                description: "Conditions are good for this activity.",
            }
        }
        if (score < 8) {
            return {
                label: "Great",
                description: "Conditions are great for this activity.",
            }
        }
        return {
            label: "Epic",
            description: "Conditions are epic for this activity.",
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
    const getSurfRating = (stats: any) => {
        const { waveHeight, waveDirection, wavePeriod, swellHeight, swellDirection, swellPeriod, windSpeed, windDirection, windGusts, seaTemperature, airTemperature, weatherCode } = stats;
        let score = 0;
        let factors = [];
        if (waveHeight < 0.5) {
            score -= 2;
            factors.push("Wave height too small");
        }
        if (waveHeight > 1.2) {
            score += 3;
            factors.push("Wave height good");
        }
        if (waveDirection < 0 || waveDirection > 180) {
            score -= 2;
            factors.push("Wave direction too small");
        }
        if (wavePeriod < 5) {
            score -= 2;
            factors.push("Wave period too small");
        }
        if (wavePeriod > 10) {
            score += 2;
            factors.push("Wave period good");
        }
        if (swellHeight < 0.5) {
            score -= 2;
            factors.push("Swell height too small");
        }
        if (swellHeight > 1.2) {
            score += 3;
            factors.push("Swell height good");
        }
        if (swellDirection < 0 || swellDirection > 180) {
            score -= 2;
            factors.push("Swell direction too small");
        }
        if (swellPeriod < 5) {
            score -= 2;
            factors.push("Swell period too small");
        }
        if (swellPeriod > 10) {
            score += 2;
            factors.push("Swell period good");
        }
        if (windSpeed < 5) {
            score -= 2;
            factors.push("Wind speed too small");
        }
        if (windSpeed > 15) {
            score += 2;
            factors.push("Wind speed good");
        }
        if (windDirection < 0 || windDirection > 180) {
            score -= 2;
            factors.push("Wind direction too small");
        }
        if (windGusts && windGusts < 5) {
            score -= 2;
            factors.push("Wind gusts too small");
        }
        if (windGusts && windGusts > 15) {
            score += 2;
            factors.push("Wind gusts good");
        }
        if (seaTemperature < 15) {
            score -= 2;
            factors.push("Sea temperature too small");
        }
        if (seaTemperature > 25) {
            score += 2;
            factors.push("Sea temperature good");
        }
        if (airTemperature && airTemperature < 15) {
            score -= 2;
            factors.push("Air temperature too small");
        }
        if (airTemperature && airTemperature > 25) {
            score += 2;
            factors.push("Air temperature good");
        }
        // if (weatherCode && weatherCode < 0 || weatherCode > 180) {
        //     score -= 2;
        //     factors.push("Weather code too small");
        // }
        return { score, factors };
    }
    const getSupRating = (stats: any) => {
        const {
            waveHeight,
            waveDirection,
            wavePeriod,
            swellHeight,
            swellDirection,
            swellPeriod,
            windSpeed,
            windDirection,
            windGusts,
            seaTemperature,
            airTemperature,
        } = stats;

        let score = 0;
        let factors: string[] = [];

        // 🌊 Altura de ola (mejor baja)
        if (waveHeight > 1) {
            score -= 3;
            factors.push("Waves too big for SUP");
        }
        if (waveHeight < 0.6) {
            score += 3;
            factors.push("Flat water ideal");
        }

        // 🌊 Período (mejor corto)
        if (wavePeriod && wavePeriod > 10) {
            score -= 2;
            factors.push("Long period swell unstable");
        }
        if (wavePeriod && wavePeriod < 6) {
            score += 1;
            factors.push("Short period manageable");
        }

        // 🌊 Swell
        if (swellHeight && swellHeight > 1) {
            score -= 2;
            factors.push("Swell too strong");
        }

        // 💨 Viento (clave en SUP)
        if (windSpeed && windSpeed > 15) {
            score -= 3;
            factors.push("Wind too strong");
        }
        if (windSpeed && windSpeed < 8) {
            score += 3;
            factors.push("Light wind ideal");
        }

        if (windGusts && windGusts > 18) {
            score -= 2;
            factors.push("Gusty conditions unstable");
        }

        // 🌡 Temperatura (confort)
        if (seaTemperature && seaTemperature > 18) {
            score += 1;
            factors.push("Comfortable sea temperature");
        }

        if (airTemperature && airTemperature > 18) {
            score += 1;
            factors.push("Comfortable air temperature");
        }

        return { score, factors };
    };
    const getSwimmingRating = (stats: any) => {
        const {
            waveHeight,
            wavePeriod,
            swellHeight,
            swellPeriod,
            windSpeed,
            windGusts,
            seaTemperature,
            airTemperature,
        } = stats;

        let score = 0;
        let factors: string[] = [];

        // 🌊 Altura de ola (clave para seguridad)
        if (waveHeight && waveHeight > 0.8) {
            score -= 4;
            factors.push("Waves too high for safe swimming");
        }
        if (waveHeight && waveHeight < 0.5) {
            score += 3;
            factors.push("Calm surface ideal");
        }

        // 🌊 Swell
        if (swellHeight && swellHeight > 1) {
            score -= 3;
            factors.push("Strong swell unsafe");
        }

        // 🌊 Periodo (periodos largos generan energía potente)
        if (wavePeriod && wavePeriod > 10) {
            score -= 2;
            factors.push("Long period swell strong energy");
        }
        if (wavePeriod && wavePeriod < 6) {
            score += 2;
            factors.push("Short period manageable");
        }

        // 💨 Viento
        if (windSpeed && windSpeed > 15) {
            score -= 3;
            factors.push("Wind too strong");
        }
        if (windSpeed && windSpeed < 8) {
            score += 2;
            factors.push("Light wind ideal");
        }

        // 💨 Ráfagas
        if (windGusts && windGusts > 18) {
            score -= 2;
            factors.push("Gusty conditions unstable");
        }

        // 🌡 Temperatura del agua (muy importante)
        if (seaTemperature) {
            if (seaTemperature < 14) {
                score -= 4;
                factors.push("Water dangerously cold");
            } else if (seaTemperature < 18) {
                score -= 1;
                factors.push("Cold water");
            } else if (seaTemperature >= 18 && seaTemperature <= 24) {
                score += 3;
                factors.push("Comfortable water temperature");
            } else if (seaTemperature > 26) {
                score -= 1;
                factors.push("Water too warm");
            }
        }

        // 🌡 Temperatura ambiente (secundario)
        if (airTemperature && airTemperature > 18) {
            score += 1;
        }

        return { score, factors };
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