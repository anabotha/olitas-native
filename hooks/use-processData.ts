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
// Normaliza diferencias de ángulos a 0–180
const angleDiff = (a: number, b: number) => {
    let diff = Math.abs(a - b);
    return diff > 180 ? 360 - diff : diff;
};
// =============================
// 2️⃣ Evaluar seguridad por hora
// =============================
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
export const processData = (data?: MarineWeatherData, forecastData?: ForecastData, beachOrientation?: number, beachName?: string): CombinedConditions | null => {
    if (!data) return null;
    // if (!forecastData) return null;
    const getTime = (date: Date) => {
        return date.toISOString().split("T")[1].split(":")[0]
    }

    const getDate = (date: Date) => {
        return date.toISOString().split("T")[0]
    }
    const todaysforecast = useProcessForecast(forecastData);
    console.log(todaysforecast)
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
        // console.log(processData);
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
                label: "Tranqui",
                description: "Normalito, podria estar mejor",
            }
        }
        if (score < 6) {
            return {
                label: "Buenisimo",
                description: "Agarra el traje",
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

    const evaluateTide = (currentMSL: number, previousMSL: number) => {
        const isRising = currentMSL > previousMSL;

        // Definimos "Alta" o "Baja" según el nivel (en Comodoro +/- 1.5 es el umbral)
        let stage: 'high' | 'low' | 'mid' = 'mid';
        if (currentMSL > 1.2) stage = 'high';
        if (currentMSL < -1.2) stage = 'low';

        return { stage, isRising };
    };

    const analyzeSeaState = (stats: any) => {
        const {
            swell_wave_height,
            wave_height,
            wind_wave_height_max,
            sea_level_height_msl,
            windSpeed
        } = stats;

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
    // const getSurfRating = (stats: any, beachOrientation: number) => {
    //     const {
    //         swell_wave_height,
    //         swell_wave_period,
    //         swell_wave_period_max,
    //         wind_speed,
    //         wind_direction,
    //         wave_direction,
    //         swell_direction,
    //         sea_level_height_msl
    //     } = stats;

    //     let score = 0;
    //     let factors: string[] = [];

    //     // 1. Cálculo de ángulos (Viento y Swell)
    //     const windDiff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
    //     const swellDiff = Math.abs((swell_direction - beachOrientation + 180 + 360) % 360 - 180);

    //     const isOffshore = windDiff > 135;
    //     const isOnshore = windDiff < 45;
    //     const swellComingToBeach = swellDiff < 60; // ¿El swell apunta a la costa?

    //     /* =========================
    //        1️⃣ GATE DE VIABILIDAD
    //     ========================== */
    //     if (swell_wave_height < 0.5 || !swellComingToBeach) {
    //         return { score: 1, factors: ["Mar calmo o swell en otra dirección"] };
    //     }

    //     /* =========================
    //        2️⃣ CALIDAD DEL SWELL (Energía)
    //     ========================== */
    //     // La energía real es (Altura^2 * Período). Aquí simplificamos:
    //     if (swell_wave_height >= 1.0) score += 4;
    //     if (swell_wave_period_max >= 10) {
    //         score += 4;
    //         factors.push("Período largo");
    //         factors.push("Olas con fuerza");
    //     } else if (swell_wave_period_max < 7) {
    //         score -= 2;
    //         factors.push("Período corto");
    //         factors.push("Ola débil");

    //     }

    //     /* =========================
    //        3️⃣ EL "TOQUE" DEL VIENTO
    //     ========================== */
    //     if (isOffshore) {
    //         if (wind_speed < 20) {
    //             score += 3;
    //             factors.push("Offshore");
    //             factors.push("Ola peinada");
    //         } else {
    //             score += 1; // Demasiado offshore dificulta bajar la ola
    //             factors.push("Mucho viento de tierra");
    //             factors.push("Cuesta entrar en la ola");
    //         }
    //     } else if (isOnshore && wind_speed > 12) {
    //         score -= 4;
    //         factors.push("Onshore");
    //         factors.push("Mar picado");
    //     }

    //     /* =========================
    //        4️⃣ RELACIÓN MAREA (Punto de marea)
    //     ========================== */
    //     // Dependiendo de la playa, pero el "repunte" (subiendo) suele ser mejor
    //     if (sea_level_height_msl > -0.2 && sea_level_height_msl < 0.4) {
    //         score += 2;
    //         factors.push("Marea media");
    //         factors.push("Punto óptimo");
    //     }


    //     const finalScore = Math.min(Math.max(0, score), 10);

    //     return {
    //         score: finalScore,
    //         factors,
    //         isEpic: finalScore >= 8 && isOffshore
    //     };
    // };
    // const getSupRating = (stats: any, beachOrientation: number) => {
    //     const { wind_speed, wind_direction, wave_height, wind_wave_period } = stats;

    //     // 1. Cálculos de Dirección
    //     const diff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
    //     const isOffshore = diff > 135;
    //     const isOnshore = diff < 45;
    //     const isCrossshore = !isOnshore && !isOffshore;

    //     // 2. Alerta de Seguridad Inmediata (Short-circuit)
    //     const isDangerousOffshore = isOffshore && wind_speed > 12;
    //     const isExtremeWind = wind_speed > 22;

    //     if (isDangerousOffshore || isExtremeWind) {
    //         return {
    //             score: 0,
    //             factors: [isDangerousOffshore ? "PELIGRO: Viento de tierra fuerte" : "Viento extremo"],
    //             dangerLevel: 'HIGH',
    //             isGlassy: false
    //         };
    //     }

    //     let score = 5;
    //     let factors: string[] = [];

    //     // 3. Condición Glassy
    //     const isGlassy = wind_speed < 12 && wave_height < 0.4;
    //     if (isGlassy) {
    //         score = 10; // El paraíso del SUP
    //         factors.push("Condiciones espejo (Ideal)");
    //     } else {
    //         // Viento
    //         if (wind_speed < 19) score += 3;
    //         else if (wind_speed > 27) score -= 4;

    //         // Dirección
    //         if (isCrossshore) {
    //             score -= 2;
    //             factors.push("Viento lateral: Afecta el rumbo");
    //         }

    //         // Estabilidad del agua
    //         if (wind_wave_period < 4 && wind_speed > 10) {
    //             score -= 3;
    //             factors.push("Mar picado (Choppy)");
    //         }
    //     }

    //     return {
    //         score: Math.min(Math.max(0, score), 10),
    //         factors: [...new Set(factors)],
    //         dangerLevel: 'NORMAL',
    //         isGlassy
    //     };
    // };
    // const getSwimmingRating = (stats: any, beachOrientation: number) => {
    //     const {
    //         sea_temperature,
    //         windSpeed,
    //         windDirection,
    //         wind_wave_height_max,
    //         air_temperature,
    //         wave_height,
    //         sea_level_height_msl
    //     } = stats;

    //     let score = 5; // Empezamos en un punto medio (neutro)
    //     let factors: string[] = [];

    //     // 1. Cálculo de Diferencia de Ángulo (Viento vs Playa)
    //     // 0° de diferencia = Onshore (viento hacia la costa)
    //     // 180° de diferencia = Offshore (viento desde la costa)
    //     const diff = Math.abs((windDirection - beachOrientation + 180 + 360) % 360 - 180);
    //     const isOnshore = diff < 45;
    //     const isOffshore = diff > 135;
    //     const isCrossshore = !isOnshore && !isOffshore;

    //     // --- TEMPERATURA ---
    //     if (sea_temperature < 14) {
    //         score -= 3;
    //         factors.push("Agua muy fría (neoprene grueso)");
    //     } else if (sea_temperature > 19) {
    //         score += 2;
    //         factors.push("Temperatura agradable");
    //     }

    //     if (air_temperature < 12 && windSpeed > 20) {
    //         score -= 2;
    //         factors.push("Riesgo de hipotermia al salir (Wind Chill)");
    //     }

    //     // --- CORDERITOS (Choppiness) ---
    //     // Se producen por viento fuerte soplando contra la costa (Onshore) 
    //     // o viento muy fuerte sin importar dirección.
    //     if (windSpeed > 15) {
    //         if (isOnshore) {
    //             score -= 4;
    //             factors.push("Corderitos");
    //         } else if (isCrossshore && windSpeed > 22) {
    //             score -= 2;
    //             factors.push("Mar movido");
    //         } else if (isOffshore) {
    //             score += 1;
    //             factors.push("Viento de tierra");
    //             factors.push("Mar planchado");
    //         }
    //     }

    //     // --- CORRIENTES FUERTES ---
    //     // Estimación: Viento lateral sostenido + oleaje alto
    //     if (isCrossshore && windSpeed > 20) {
    //         score -= 3;
    //         factors.push("Peligro: Corriente lateral fuerte");
    //     }

    //     // --- OLEAJE ---
    //     if (wave_height > 1.2) {
    //         score -= 3;
    //         factors.push("Oleaje alto");
    //         factors.push("Entrada difícil");
    //     } else if (wave_height < 0.5 && isOffshore) {
    //         score += 3;
    //         factors.push("Condiciones ideales");
    //         factors.push("Mar planchado");
    //     }

    //     // --- MAREA (Basado en tu lógica previa) ---
    //     if (sea_level_height_msl < -0.3) {
    //         score += 1;
    //         factors.push("Marea baja");
    //     }

    //     // Asegurar que el score esté entre 0 y 10
    //     const finalScore = Math.min(Math.max(0, score), 10);

    //     return { score: finalScore, factors, windType: isOnshore ? 'Onshore' : isOffshore ? 'Offshore' : 'Cross-shore' };
    // };
    // ============================================================
    // ============================================================
    // ============================================================
    // SURF RATING — v4 (viento en km/h)
    // MAX_RAW = 15
    // ============================================================
    // ============================================================
    // CONFIGURACIÓN DE SPOTS — rango mareal
    // ============================================================
    const SPOT_TIDAL_CONFIG: Record<string, { tidalRange: number; tidalMin: number }> = {
        "Rada Tilly": { tidalRange: 5.2, tidalMin: 0.6 },
        "Costanera Comodoro": { tidalRange: 5.2, tidalMin: 0.6 },
        "Km 3": { tidalRange: 5.2, tidalMin: 0.6 },
        "Restinga Alí": { tidalRange: 5.2, tidalMin: 0.6 },
        "Caleta Olivia": { tidalRange: 5.0, tidalMin: 0.5 }, // ligeramente distinto por estar más al sur
    };

    const getTidalPhase = (
        sea_level_height_msl: number,
        previous_sea_level_height_msl: number,
        spotName: string
    ): { phase: 'low' | 'mid' | 'high'; isRising: boolean; normalized: number } => {
        const config = SPOT_TIDAL_CONFIG[spotName] ?? { tidalRange: 5.2, tidalMin: 0.6 };
        // Normalizar: 0 = bajamar, 1 = pleamar
        const normalized = Math.min(1, Math.max(0,
            (sea_level_height_msl - config.tidalMin) / config.tidalRange
        ));
        const isRising = sea_level_height_msl > previous_sea_level_height_msl;
        const phase = normalized < 0.3 ? 'low' : normalized > 0.7 ? 'high' : 'mid';
        return { phase, isRising, normalized };
    };


    // ============================================================
    // SURF RATING — v5 (km/h + marea corregida + período 0)
    // MAX_RAW = 15
    // ============================================================
    const getSurfRating = (stats: any, beachOrientation: number, spotName: string) => {
        const {
            swell_wave_height,
            swell_wave_period,
            swell_wave_period_max,
            wind_speed,
            wind_direction,
            swell_direction,
            wind_wave_height,
            sea_level_height_msl,
            previous_sea_level_height_msl,
        } = stats;

        const MAX_RAW = 15;
        let score = 0;
        let factors: string[] = [];

        const windDiff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
        const swellDiff = Math.abs((swell_direction - beachOrientation + 180 + 360) % 360 - 180);

        const isOffshore = windDiff > 135;
        const isOnshore = windDiff < 45;
        const swellHitsBeach = swellDiff < 70;

        /* ── GATE ─────────────────────────────────────────────── */
        if (swell_wave_height < 0.4) return { score: 1, factors: ["Mar plano"] };
        if (!swellHitsBeach) return { score: 1, factors: ["Swell no apunta a la playa"] };

        /* ── 1. ENERGÍA (0–5) ────────────────────────────────── */
        // Tratar period=0 como dato no disponible
        const rawPeriod = swell_wave_period_max || swell_wave_period || 0;
        const period = rawPeriod > 0 ? rawPeriod : null;
        const swellEnergy = Math.pow(swell_wave_height, 2) * (period ?? 7); // fallback neutro

        if (swellEnergy >= 12) score += 5;
        else if (swellEnergy >= 6) score += 4;
        else if (swellEnergy >= 3) score += 3;
        else if (swellEnergy >= 1.5) score += 2;
        else if (swellEnergy >= 0.5) score += 1;

        /* ── 2. PERÍODO (0–3) ────────────────────────────────── */
        if (period === null) {
            // Sin dato — no penalizar
        } else if (period >= 14) { score += 3; factors.push("Groundswell de largo recorrido"); }
        else if (period >= 10) { score += 2; factors.push("Período largo"); }
        else if (period >= 7) { score += 1; }
        else { score -= 1; factors.push("Período corto — ola cerrada"); }

        /* ── 3. ÁNGULO DEL SWELL (0–1) ──────────────────────── */
        if (swellDiff >= 15 && swellDiff <= 45) {
            score += 1;
            factors.push("Ángulo de swell favorable");
        }

        /* ── 4. VIENTO (-4–3) — km/h ─────────────────────────── */
        if (isOffshore) {
            if (wind_speed <= 25) { score += 3; factors.push("Offshore suave"); }
            else if (wind_speed <= 45) { score += 1; factors.push("Offshore fuerte"); }
            else { score -= 1; factors.push("Offshore extremo"); }
        } else if (isOnshore) {
            if (wind_speed < 15) { factors.push("Onshore leve"); }
            else if (wind_speed < 28) { score -= 2; factors.push("Onshore — mar picado"); }
            else { score -= 4; factors.push("Onshore fuerte"); }
        } else {
            if (wind_speed > 35) { score -= 2; factors.push("Viento lateral fuerte"); }
        }

        /* ── 5. INTERFERENCIA WIND WAVES (-2–0) ─────────────── */
        if (wind_wave_height != null) {
            const ratio = wind_wave_height / swell_wave_height;
            if (ratio > 0.6) { score -= 2; factors.push("Mar confuso (chop domina)"); }
            else if (ratio > 0.3) { score -= 1; factors.push("Algo de chop"); }
        }

        /* ── 6. MAREA (0–3) ──────────────────────────────────── */
        const tide = getTidalPhase(sea_level_height_msl, previous_sea_level_height_msl, spotName);

        if (tide.phase === 'mid') { score += 2; factors.push("Marea media"); }
        else if (tide.phase === 'high') { score -= 1; factors.push("Marea alta "); factors.push("Ola puede cerrar"); }
        else { score += 1; factors.push("Marea baja"); }

        if (tide.isRising) { score += 1; factors.push("Marea subiendo"); }

        const finalScore = Math.round(Math.min(Math.max(0, (score / MAX_RAW) * 10), 10));
        return {
            score: finalScore,
            factors: [...new Set(factors)],
            isEpic: finalScore >= 9 && isOffshore,
        };
    };


    // ============================================================
    // SUP RATING — v5 (km/h + marea corregida + período 0)
    // MAX_RAW = 10
    // ============================================================
    const getSupRating = (stats: any, beachOrientation: number, spotName: string) => {
        const {
            windSpeed,
            wind_direction,
            wave_height,
            swell_wave_height,
            wind_wave_height,
            wind_wave_period,
            sea_level_height_msl,
            previous_sea_level_height_msl,
            wind_gusts,
        } = stats;

        const diff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
        const isOffshore = diff > 135;
        const isOnshore = diff < 45;
        const isCross = !isOnshore && !isOffshore;

        const effectiveWind = (wind_gusts != null && wind_gusts > 0)
            ? Math.max(windSpeed, wind_gusts * 0.85)
            : windSpeed;
        /* ── HARD STOPS — km/h ───────────────────────────────── */
        if (isOffshore && effectiveWind > 22) {
            return { score: 0, factors: ["⚠️ PELIGRO: Viento de tierra fuerte"], dangerLevel: 'HIGH', isGlassy: false };
        }
        if (effectiveWind > 55) {
            return { score: 0, factors: ["⚠️ Viento extremo"], dangerLevel: 'HIGH', isGlassy: false };
        }
        const waveRef = wave_height ?? swell_wave_height ?? 0;
        const isGlassy = effectiveWind < 15 && waveRef < 0.3;

        if (isGlassy) {
            return { score: 10, factors: ["Espejo"], dangerLevel: 'NONE', isGlassy: true };
        }

        const MAX_RAW = 10;
        let score = 0;
        let factors: string[] = [];

        /* ── VIENTO (0–4) — km/h ─────────────────────────────── */
        if (effectiveWind < 15) { score += 4; factors.push("Viento calmo"); }
        else if (effectiveWind < 22) { score += 3; factors.push("Viento suave"); }
        else if (effectiveWind < 33) { score += 2; factors.push("Viento moderado"); }
        else if (effectiveWind < 45) { score += 1; factors.push("Viento fuerte — remar cuesta"); }
        else { factors.push("Viento muy fuerte"); }

        if (wind_gusts != null && wind_gusts - windSpeed > 15) {
            score -= 1;
            factors.push("Ráfagas fuertes");
        }

        /* ── DIRECCIÓN (0–2) ─────────────────────────────────── */
        if (!isCross && !isOffshore) { score += 2; }
        else if (isCross && effectiveWind < 22) { score += 1; factors.push("Viento lateral leve"); }
        else if (isCross) { factors.push("Viento lateral — desvía el rumbo"); }

        /* ── CHOP (0–2) ──────────────────────────────────────── */
        const windWaveH = wind_wave_height ?? 0;
        const windWaveP = wind_wave_period ?? 99;
        if (windWaveH < 0.15) { score += 2; }
        else if (windWaveH < 0.3 || windWaveP >= 6) { score += 1; }
        else if (windWaveH > 0.4 && windWaveP < 5) { score -= 1; factors.push("Mar picado (chop corto)"); }

        /* ── OLEAJE (0–1) ────────────────────────────────────── */
        if (waveRef < 0.5) { score += 1; }
        else if (waveRef >= 1.0 && waveRef <= 1.8) { score += 1; factors.push("Olas aprovechables"); }
        else if (waveRef > 1.8) { score -= 1; factors.push("Olas grandes "); }

        /* ── MAREA (0–1) ─────────────────────────────────────── */
        const tide = getTidalPhase(sea_level_height_msl, previous_sea_level_height_msl, spotName);
        if (tide.phase === 'mid') { score += 1; }
        else if (tide.phase === 'low') { factors.push("Marea muy baja"); }

        const finalScore = Math.round(Math.min(Math.max(0, (score / MAX_RAW) * 10), 10));
        return {
            score: finalScore,
            factors: [...new Set(factors)],
            dangerLevel: finalScore <= 2 ? 'MEDIUM' : 'NORMAL',
            isGlassy,
        };
    };


    // ============================================================
    // SWIMMING RATING — v5 (km/h + marea corregida + período 0)
    // MAX_RAW = 12
    // ============================================================
    const getSwimmingRating = (stats: any, beachOrientation: number, spotName: string) => {
        const {
            sea_temperature,
            air_temperature,
            windSpeed,
            wind_direction,
            wave_height,
            wind_wave_height,
            wind_wave_period,
            swell_wave_height,
            swell_direction,
            sea_level_height_msl,
            previous_sea_level_height_msl,
            uv_index,
            precipitation,
        } = stats;

        const MAX_RAW = 12;
        let score = 0;
        let factors: string[] = [];

        const windDiff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
        const swellDiff = swell_direction != null
            ? Math.abs((swell_direction - beachOrientation + 180 + 360) % 360 - 180)
            : null;

        const isOnshore = windDiff < 45;
        const isOffshore = windDiff > 135;
        const isCross = !isOnshore && !isOffshore;

        const totalWave = wave_height ?? Math.max(swell_wave_height ?? 0, wind_wave_height ?? 0);

        /* ── 1. TEMPERATURA AGUA (0–3) ───────────────────────── */
        // if (sea_temperature >= 22) { score += 3; factors.push("Agua cálida — ideal"); }
        // else if (sea_temperature >= 18) { score += 2; factors.push("Temperatura del agua ideal"); }
        // else if (sea_temperature >= 15) { score += 1; factors.push("Agua fresca — tolerable"); }
        // else if (sea_temperature >= 12) { score += 0; factors.push("Agua fría — neoprene recomendado"); }
        // else { score -= 2; factors.push("Agua muy fría — riesgo de hipotermia"); }

        // /* ── 2. WIND CHILL (0–1) — km/h ─────────────────────── */
        // const windChill = (air_temperature ?? 20) - (wind_speed * 0.22);
        // if (windChill >= 18) { score += 1; factors.push("Calor exterior agradable"); }
        // else if (windChill < 10) { score -= 1; factors.push("Wind chill — frío al salir"); }

        /* ── 3. OLEAJE (0–3) ─────────────────────────────────── */
        if (totalWave < 0.2) { score += 3; factors.push("Mar planchado"); }
        else if (totalWave < 0.5) { score += 2; }
        else if (totalWave < 0.8) { score += 1; }
        else if (totalWave < 1.2) { score -= 1; factors.push("Oleaje moderado"); }
        else if (totalWave < 1.5) { score -= 2; factors.push("Oleaje alto"); }
        else { score -= 3; factors.push("Oleaje peligroso"); }

        /* ── 4. VIENTO / CHOP (0–2) — km/h ──────────────────── */
        if (windSpeed < 15) { score += 2; }
        else if (windSpeed < 28 && !isOnshore) { score += 1; }
        else if (isOnshore && windSpeed >= 28) { score -= 2; factors.push("Corderitos"); factors.push("Mar agitado"); }
        else if (isOffshore && windSpeed < 28) { score += 1; factors.push("Viento de tierra"); factors.push("Mar planchado"); }

        /* ── 5. CORRIENTES — km/h ────────────────────────────── */
        const tide = getTidalPhase(sea_level_height_msl, previous_sea_level_height_msl, spotName);
        const swellCrossed = swellDiff != null && swellDiff > 30 && swellDiff < 80;
        const tidalDrop = !tide.isRising && tide.phase !== 'high';

        if (isCross && windSpeed > 33) {
            score -= 2;
            factors.push("⚠️ Corriente lateral fuerte");
        }
        if (swellCrossed && totalWave > 0.8 && tidalDrop) {
            score -= 2;
            factors.push("⚠️ Riesgo de corriente de resaca");
        }

        /* ── 6. MAREA (0–2) ──────────────────────────────────── */
        if (tide.phase === 'mid') { score += 2; factors.push("Marea cómoda"); }
        else if (tide.phase === 'high') { score += 1; }
        else if (tide.phase === 'low') {  factors.push("Marea muy baja"); }

        /* ── 7. LLUVIA / UV (0–1) ────────────────────────────── */
        if (precipitation != null && precipitation > 2) {
            score -= 1;
            factors.push("Lluvia");
        } else if (uv_index != null && uv_index >= 8) {
            score -= 1;
            factors.push(`UV muy alto (${uv_index})`);
        } else {
            score += 1;
        }

        const finalScore = Math.round(Math.min(Math.max(0, (score / MAX_RAW) * 10), 10));
        return {
            score: finalScore,
            factors: [...new Set(factors)],
            windType: isOnshore ? 'Onshore' : isOffshore ? 'Offshore' : 'Cross-shore',
            dangerLevel: finalScore <= 2 ? 'HIGH' : finalScore <= 4 ? 'MEDIUM' : 'NORMAL',
        };
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