"use client"

import { ActivityRating, CombinedConditions, MarineWeatherData, ActivityType, ForecastData } from "@/lib/types"
import { use, useMemo } from "react"
import { useForecast } from "./use-forecast";
import { useProcessForecast } from "./use-proccessForecast";
// =============================
// Tipos
// =============================

type SafetyColor = "green" | "yellow" | "red";

interface SafetyStatus {
    color: SafetyColor;
    label: string;
    message: string;
}

interface HourSnapshot {
    time: Date;
    wind_speed: number;
    wind_direction: number;
    sea_level_height_msl?: number;
}

// =============================
// Utils
// =============================

const isValid = (n: number) =>
    typeof n === "number" && !Number.isNaN(n);

const riskScore: Record<SafetyColor, number> = {
    green: 0,
    yellow: 1,
    red: 2
};

// =============================
// 1️⃣ Normalizar hourly
// =============================

const normalizeHourly = (hourly: any): HourSnapshot[] => {
    return hourly.time.map((t: Date, i: number) => ({
        time: new Date(t),
        wind_speed: hourly.wind_speed_10m?.[i],
        wind_direction: hourly.wind_direction_10m?.[i],
        sea_level_height_msl: hourly.sea_level_height_msl?.[i]
    }));
};

// =============================
// 2️⃣ Evaluar seguridad por hora
// =============================

const getSafetyStatus = (
    snapshot: HourSnapshot,
    beachOrientation = 90
): SafetyStatus => {

    const { wind_speed, wind_direction, sea_level_height_msl } = snapshot;

    if (!isValid(wind_speed)) {
        return {
            color: "green",
            label: "SIN DATOS",
            message: "Datos insuficientes."
        };
    }

    const { windCond } = evaluateWind(wind_direction, beachOrientation);

    // OFFSHORE
    if (windCond === "offshore") {
        if (wind_speed > 45) {
            return {
                color: "red",
                label: "PELIGRO",
                message: "Offshore muy fuerte. Riesgo de deriva mar adentro."
            };
        }
        if (wind_speed > 30) {
            return {
                color: "yellow",
                label: "PRECAUCIÓN",
                message: "Offshore moderado. Atención a corrientes."
            };
        }
    }

    // ONSHORE
    if (windCond === "onshore") {
        if (wind_speed > 45) {
            return {
                color: "red",
                label: "MUY PELIGROSO",
                message: "Onshore fuerte. Shorebreak caótico."
            };
        }
        if (wind_speed > 30) {
            return {
                color: "yellow",
                label: "PRECAUCIÓN",
                message: "Onshore moderado. Condiciones inestables."
            };
        }
    }

    // MAREA EXTREMA
    if (isValid(sea_level_height_msl) && sea_level_height_msl > 2.2) {
        return {
            color: "yellow",
            label: "MAREA ALTA",
            message: "Marea elevada. Precaución en zonas bajas."
        };
    }

    // VIENTO GENERAL
    if (wind_speed > 38) {
        return {
            color: "yellow",
            label: "ALERTA",
            message: "Viento fuerte en la zona."
        };
    }

    return {
        color: "green",
        label: "SEGURO",
        message: "Condiciones de seguridad normales."
    };
};

// =============================
// 3️⃣ Peor riesgo próximas N horas
// =============================

const getWorstSafetyNextHours = (
    hourly: any,
    beachOrientation = 90,
    hoursAhead = 6
): SafetyStatus | null => {

    const hours = normalizeHourly(hourly);

    const now = new Date();
    now.setMinutes(0, 0, 0);

    const upcoming = hours.filter(h => {
        const diff = (h.time.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diff >= 0 && diff <= hoursAhead;
    });

    if (!upcoming.length) return null;

    let worst: SafetyStatus = {
        color: "green",
        label: "SEGURO",
        message: "Condiciones de seguridad normales."
    };

    for (const hour of upcoming) {
        const status = getSafetyStatus(hour, beachOrientation);

        if (riskScore[status.color] > riskScore[worst.color]) {
            worst = status;
        }
    }

    return worst;
};
export const processData = (data?: MarineWeatherData, forecastData?: ForecastData, beachOrientation?: number): CombinedConditions | null => {
    if (!data) return null;
    // if (!forecastData) return null;
    const getTime = (date: Date) => {
        return date.toISOString().split("T")[1].split(":")[0]
    }

    const getDate = (date: Date) => {
        return date.toISOString().split("T")[0]
    }
    const todaysforecast = useProcessForecast(forecastData);
    const searchTodaysStats = () => {
        if (!data) return null

        const today = getDate(new Date())
        const now = getTime(new Date())
        const index = data.daily.time.findIndex(
            (date) => getDate(date) === today
        )
        const hourly = data.hourly.time.findIndex((time) => getTime(time) === now)

        if (index === -1) return null
        // console.log(forecastData)
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
            sea_level_height_msl: data.hourly.sea_level_height_msl?.[hourly] ?? null,
            windSpeed: forecastData?.hourly.wind_speed_10m[hourly] ?? null,
            windDirection: forecastData?.hourly.wind_direction_10m[hourly] ?? null,
        }
        console.log(processData);
        return processData ? processData : null;
    }

    const getLabel = (score: number): Partial<ActivityRating> => {
        if (score < 2) {
            return {
                label: "Horrible",
                description: "Condiciones no aptas para esta actividad",
            }
        }
        if (score < 3) {
            return {
                label: "Jodido",
                description: "",
            }
        }
        if (score < 4) {
            return {
                label: "Apto",
                description: "Normalito, podria estar mejor",
            }
        }
        if (score < 6) {
            return {
                label: "Buenisimo",
                description: "Buenas condiciones",
            }
        }
        if (score < 8) {
            return {
                label: "Ideal",
                description: "Condiciones muy buenas",
            }
        }
        return {
            label: "Increible",
            description: "Esta ideal",
        }
    }
    const getRating = (
        data: CombinedConditions,
        activity: ActivityType,
        beachOrientation: number
    ): ActivityRating | null => {

        switch (activity) {
            case "surf": {
                const { score, factors } = getSurfRating(data, beachOrientation);
                return { ...getLabel(score), factors };
            }

            case "sup": {
                const { score, factors } = getSupRating(data, beachOrientation);
                return { ...getLabel(score), factors };
            }

            case "swimming": {
                const { score, factors } = getSwimmingRating(data, beachOrientation);
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
    const evaluateTide = (currentMSL: number, previousMSL: number) => {
        const isRising = currentMSL > previousMSL;

        // Definimos "Alta" o "Baja" según el nivel (en Comodoro +/- 1.5 es el umbral)
        let stage: 'high' | 'low' | 'mid' = 'mid';
        if (currentMSL > 1.2) stage = 'high';
        if (currentMSL < -1.2) stage = 'low';

        return { stage, isRising };
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
    const analyzeSeaState = (stats: any) => {
        const {
            swell_wave_height,
            wave_height,
            wind_wave_height_max,
            sea_level_height_msl,
            windSpeed
        } = stats;

        console.log("windspeed", wind_wave_height_max)
        const isLowWind = windSpeed < 8;
        const isLowSwell = wave_height < 0.7;
        const isShortWindWave = wind_wave_height_max < 0.5;

        let condition = "Normal";

        if (isLowWind && isLowSwell && isShortWindWave) {
            condition = "Planchado"; // Efecto espejo o "Glassy"
        }
        else if (windSpeed > 15 && wave_height > swell_wave_height * 1.5) {
            condition = "Picado"; // "Choppy"
        }

        // Evaluación de Marea para Comodoro/RT
        let tideInfo = "Media";
        if (sea_level_height_msl < -1.5) tideInfo = "Bajamar";
        if (sea_level_height_msl > 1.5) tideInfo = "Pleamar";

        return { condition, tideInfo };
    };
    const getCurrentHourIndex = (timeArray: string[] | Date[]) => {
        if (!Array.isArray(timeArray)) return -1;

        const now = new Date();

        let closestIndex = -1;
        let smallestDiff = Infinity;

        timeArray.forEach((t, i) => {
            const date = new Date(t);
            const diff = Math.abs(date.getTime() - now.getTime());

            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestIndex = i;
            }
        });

        // Solo aceptamos si está dentro de 1 hora
        if (smallestDiff <= 60 * 60 * 1000) {
            return closestIndex;
        }

        return -1;
    };
    const getCurrentSafety = (
        marine: MarineWeatherData,
        forecast: ForecastData | undefined,
        beachOrientation = 90
    ): SafetyStatus => {
        if (!marine?.hourly || !forecast?.hourly) return {
            color: "green",
            label: "SIN DATOS",
            message: "Datos insuficientes."
        };

        const marineIdx = getCurrentHourIndex(marine.hourly.time);
        const forecastIdx = getCurrentHourIndex(forecast.hourly.time);

        if (marineIdx === -1 || forecastIdx === -1) return null;

        const wind_speed = forecast.hourly.wind_speed_10m?.[forecastIdx];
        const wind_direction = forecast.hourly.wind_direction_10m?.[forecastIdx];
        const sea_level_height_msl = marine.hourly.sea_level_height_msl?.[marineIdx];

        if (!isValid(wind_speed) || !isValid(wind_direction)) {
            return {
                color: "green",
                label: "SIN DATOS",
                message: "Datos insuficientes."
            };
        }

        const { windCond } = evaluateWind(wind_direction, beachOrientation);

        /* =========================
           OFFSHORE
        ========================== */

        if (windCond === "offshore") {

            if (wind_speed > 45) {
                return {
                    color: "red",
                    label: "PELIGRO",
                    message: "Offshore muy fuerte. Riesgo de deriva mar adentro."
                };
            }
            if (wind_speed > 30) {
                return {
                    color: "yellow",
                    label: "PRECAUCIÓN",
                    message: "Offshore moderado. Atención a corrientes."
                };
            }
        }

        /* =========================
           ONSHORE
        ========================== */

        if (windCond === "onshore") {
            if (wind_speed > 45) {
                return {
                    color: "red",
                    label: "MUY PELIGROSO",
                    message: "Viento fuerte entrando al mar. Shorebreak caótico."
                };
            }
            if (wind_speed > 30) {
                return {
                    color: "yellow",
                    label: "PRECAUCIÓN",
                    message: "Viento entrando al mar. Condiciones inestables."
                };
            }
        }
        //ALERTAS 
        if (wind_speed > 80) {
            return {
                color: "red",
                label: "PELIGRO",
                message: "ALERTA ROJA POR VIENTO FUERTE"
            };
        }
        if (wind_speed > 55) {
            return {
                color: "red",
                label: "PELIGRO",
                message: "ALERTA AMARILLA POR VIENTO FUERTE"
            };
        }
        /* =========================
           MAREA
        ========================== */

        if (isValid(sea_level_height_msl) && sea_level_height_msl > 2.2) {
            return {
                color: "yellow",
                label: "MAREA ALTA",
                message: "Marea elevada. Precaución en zonas bajas."
            };
        }

        /* =========================
           VIENTO GENERAL
        ========================== */

        if (wind_speed > 44) {
            return {
                color: "yellow",
                label: "ALERTA",
                message: "Viento fuerte en la zona."
            };
        }

        return {
            color: "green",
            label: "SEGURO",
            message: "Condiciones de seguridad normales."
        };
    };
    const getBestWindow = (data: any, activity: ActivityType, beachOrientation?: number) => {
        const nowIndex = data.hourly.time.findIndex(t => new Date(t) >= new Date());
        let bestHour = null;
        let maxScore = -1;

        // Recorremos las próximas 24 horas
        for (let i = nowIndex; i < nowIndex + 24 && i < data.hourly.time.length; i++) {
            const hourlyStats = {
                wave_height: data.hourly.wave_height[i],
                wave_direction: data.hourly.wave_direction[i],
                swell_wave_height: data.hourly.swell_wave_height[i],
                swell_wave_direction: data.hourly.swell_wave_direction[i],
                swell_wave_period: data.hourly.swell_wave_peak_period?.[i] || 0,
                wind_speed: data.hourly.wind_speed_10m?.[i] || 0,
                wind_direction: data.hourly.wind_direction_10m?.[i] || 0,
                sea_level_height_msl: data.hourly.sea_level_height_msl[i],
                previous_sea_level_height_msl: data.hourly.sea_level_height_msl[i - 1] || 0
            };

            const { score } = activity === "surf" ? getSurfRating(hourlyStats, beachOrientation) :
                activity === "sup" ? getSupRating(hourlyStats, beachOrientation) :
                    getSwimmingRating(hourlyStats, beachOrientation);

            if (score > maxScore) {
                maxScore = score;
                bestHour = data.hourly.time[i];
            }
        }

        return {
            time: bestHour ? new Date(bestHour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
            score: maxScore
        };
    };
    // --- Refinamiento de Ratings ---
    const getSurfRating = (stats: any, beachOrientation: number) => {
        const {
            swell_wave_height,
            swell_wave_period,
            swell_wave_period_max,
            wind_speed,
            wind_direction,
            wave_direction,
            swell_direction,
            sea_level_height_msl
        } = stats;

        let score = 0;
        let factors: string[] = [];

        // 1. Cálculo de ángulos (Viento y Swell)
        const windDiff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
        const swellDiff = Math.abs((swell_direction - beachOrientation + 180 + 360) % 360 - 180);

        const isOffshore = windDiff > 135;
        const isOnshore = windDiff < 45;
        const swellComingToBeach = swellDiff < 60; // ¿El swell apunta a la costa?

        /* =========================
           1️⃣ GATE DE VIABILIDAD
        ========================== */
        if (swell_wave_height < 0.5 || !swellComingToBeach) {
            return { score: 1, factors: ["Mar calmo o swell en otra dirección"] };
        }

        /* =========================
           2️⃣ CALIDAD DEL SWELL (Energía)
        ========================== */
        // La energía real es (Altura^2 * Período). Aquí simplificamos:
        if (swell_wave_height >= 1.0) score += 4;
        if (swell_wave_period_max >= 10) {
            score += 4;
            factors.push("Período largo");
            factors.push("Olas con fuerza");
        } else if (swell_wave_period_max < 7) {
            score -= 2;
            factors.push("Período corto");
            factors.push("Ola débil");

        }

        /* =========================
           3️⃣ EL "TOQUE" DEL VIENTO
        ========================== */
        if (isOffshore) {
            if (wind_speed < 20) {
                score += 3;
                factors.push("Offshore");
                factors.push("Ola peinada");
            } else {
                score += 1; // Demasiado offshore dificulta bajar la ola
                factors.push("Mucho viento de tierra");
                factors.push("Cuesta entrar en la ola");
            }
        } else if (isOnshore && wind_speed > 12) {
            score -= 4;
            factors.push("Onshore");
            factors.push("Mar picado");
        }

        /* =========================
           4️⃣ RELACIÓN MAREA (Punto de marea)
        ========================== */
        // Dependiendo de la playa, pero el "repunte" (subiendo) suele ser mejor
        if (sea_level_height_msl > -0.2 && sea_level_height_msl < 0.4) {
            score += 2;
            factors.push("Marea media");
            factors.push("Punto óptimo");
        }


        const finalScore = Math.min(Math.max(0, score), 10);

        return {
            score: finalScore,
            factors,
            isEpic: finalScore >= 8 && isOffshore
        };
    };
    const getSupRating = (stats: any, beachOrientation: number) => {
        const { wind_speed, wind_direction, wave_height, wind_wave_period } = stats;

        // 1. Cálculos de Dirección
        const diff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
        const isOffshore = diff > 135;
        const isOnshore = diff < 45;
        const isCrossshore = !isOnshore && !isOffshore;

        // 2. Alerta de Seguridad Inmediata (Short-circuit)
        const isDangerousOffshore = isOffshore && wind_speed > 12;
        const isExtremeWind = wind_speed > 22;

        if (isDangerousOffshore || isExtremeWind) {
            return {
                score: 0,
                factors: [isDangerousOffshore ? "PELIGRO: Viento de tierra fuerte" : "Viento extremo"],
                dangerLevel: 'HIGH',
                isGlassy: false
            };
        }

        let score = 5;
        let factors: string[] = [];

        // 3. Condición Glassy
        const isGlassy = wind_speed < 12 && wave_height < 0.4;
        if (isGlassy) {
            score = 10; // El paraíso del SUP
            factors.push("Condiciones espejo (Ideal)");
        } else {
            // Viento
            if (wind_speed < 19) score += 3;
            else if (wind_speed > 27) score -= 4;

            // Dirección
            if (isCrossshore) {
                score -= 2;
                factors.push("Viento lateral: Afecta el rumbo");
            }

            // Estabilidad del agua
            if (wind_wave_period < 4 && wind_speed > 10) {
                score -= 3;
                factors.push("Mar picado (Choppy)");
            }
        }

        return {
            score: Math.min(Math.max(0, score), 10),
            factors: [...new Set(factors)],
            dangerLevel: 'NORMAL',
            isGlassy
        };
    };
    const getSwimmingRating = (stats: any, beachOrientation: number) => {
        const {
            sea_temperature,
            windSpeed,
            windDirection,
            wind_wave_height_max,
            air_temperature,
            wave_height,
            sea_level_height_msl
        } = stats;

        let score = 5; // Empezamos en un punto medio (neutro)
        let factors: string[] = [];

        // 1. Cálculo de Diferencia de Ángulo (Viento vs Playa)
        // 0° de diferencia = Onshore (viento hacia la costa)
        // 180° de diferencia = Offshore (viento desde la costa)
        const diff = Math.abs((windDirection - beachOrientation + 180 + 360) % 360 - 180);
        const isOnshore = diff < 45;
        const isOffshore = diff > 135;
        const isCrossshore = !isOnshore && !isOffshore;

        // --- TEMPERATURA ---
        if (sea_temperature < 14) {
            score -= 3;
            factors.push("Agua muy fría (neoprene grueso)");
        } else if (sea_temperature > 19) {
            score += 2;
            factors.push("Temperatura agradable");
        }

        if (air_temperature < 12 && windSpeed > 20) {
            score -= 2;
            factors.push("Riesgo de hipotermia al salir (Wind Chill)");
        }

        // --- CORDERITOS (Choppiness) ---
        // Se producen por viento fuerte soplando contra la costa (Onshore) 
        // o viento muy fuerte sin importar dirección.
        if (windSpeed > 15) {
            if (isOnshore) {
                score -= 4;
                factors.push("Corderitos");
            } else if (isCrossshore && windSpeed > 22) {
                score -= 2;
                factors.push("Mar movido");
            } else if (isOffshore) {
                score += 1;
                factors.push("Viento de tierra");
                factors.push("Mar planchado");
            }
        }

        // --- CORRIENTES FUERTES ---
        // Estimación: Viento lateral sostenido + oleaje alto
        if (isCrossshore && windSpeed > 20) {
            score -= 3;
            factors.push("Peligro: Corriente lateral fuerte");
        }

        // --- OLEAJE ---
        if (wave_height > 1.2) {
            score -= 3;
            factors.push("Oleaje alto");
            factors.push("Entrada difícil");
        } else if (wave_height < 0.5 && isOffshore) {
            score += 3;
            factors.push("Condiciones ideales");
            factors.push("Mar planchado");
        }

        // --- MAREA (Basado en tu lógica previa) ---
        if (sea_level_height_msl < -0.3) {
            score += 1;
            factors.push("Marea baja");
        }

        // Asegurar que el score esté entre 0 y 10
        const finalScore = Math.min(Math.max(0, score), 10);

        return { score: finalScore, factors, windType: isOnshore ? 'Onshore' : isOffshore ? 'Offshore' : 'Cross-shore' };
    };
    return useMemo(() => {
        const todayStats = searchTodaysStats();
        if (!todayStats) return null;
        // console.log(data)
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

                seaLevelHeightMsl: todayStats.sea_level_height_msl ?? undefined,
            },
            activities: {
                surf: getRating(todayStats, "surf", beachOrientation ? beachOrientation : 90),
                sup: getRating(todayStats, "sup", beachOrientation ? beachOrientation : 90),
                swimming: getRating(todayStats, "swimming", beachOrientation ? beachOrientation : 90),
            },
            safety: getCurrentSafety(data, forecastData, beachOrientation ? beachOrientation : 90),
            bestWindows: {
                surf: getBestWindow(data, "surf", beachOrientation ? beachOrientation : 90),
                sup: getBestWindow(data, "sup", beachOrientation ? beachOrientation : 90),
                swimming: getBestWindow(data, "swimming", beachOrientation ? beachOrientation : 90)
            },
            seaState: analyzeSeaState(todayStats)
        }
        return processedData;
    }, [data, forecastData])
}