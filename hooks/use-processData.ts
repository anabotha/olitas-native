
import { CombinedConditions, MarineWeatherData, ForecastData } from "@/lib/types"
import { use, useMemo } from "react"
import { useForecast } from "./use-forecast";
import { useProcessForecast } from "./use-proccessForecast";
import { angleDiff } from "@/lib/geometry";
// =============================
// Tipos
// =============================

type SafetyColor = "green" | "yellow" | "red";

export interface SafetyStatus {
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

export const isValid = (n: number | undefined | null): n is number =>
    typeof n === "number" && !Number.isNaN(n);

const riskScore: Record<SafetyColor, number> = {
    green: 0,
    yellow: 1,
    red: 2
};


// Cada spot pide la marea a Open-Meteo con sus propias coordenadas, pero los
// 5 spots están a pocos km entre sí (mismo golfo) — el modelo global de
// Open-Meteo casi seguro les devuelve una curva prácticamente idéntica, ya
// que su grilla no tiene resolución para captar diferencias de batimetría
// local (playa plana vs. restinga vs. caleta). SPOT_TIDAL_CONFIG reescala esa
// misma curva por spot para aproximar ese efecto.
//
// HEURÍSTICO, a ojo — no viene de una tabla de marea real ni de un modelo
// físico. La forma más confiable de calibrarlo que tenemos hoy es "cuántos
// metros de playa quedan para caminar" en baja normal / baja extrema / alta
// (más metros de playa expuesta ≈ rangeScale más alto). Estado por spot:
//   - Rada Tilly: confirmado como el de MAYOR amplitud — en baja expone hasta
//     ~20m de playa (bastante más que el resto). Se usa como referencia
//     (rangeScale 1.0), pero ver nota abajo: eso deja a Caleta Córdova con un
//     rangeScale aún mayor (1.05), lo cual no está confirmado y contradice
//     que Rada Tilly sea la de mayor swing — pendiente de revisar si se junta
//     el dato real de Caleta.
//   - Costanera Comodoro: confirmado como chica — ~5m en baja normal, ~10m en
//     baja extrema, 0-1m en alta.
//   - Km 3, Restinga Alí: sin confirmar, valores de arranque.
//   - Caleta Córdova: "corta en longitud, perfil bajito" según la experiencia
//     de quien conoce el spot, pero sin suficiente certeza para tocar el
//     número (podría sugerir MENOS swing, no más — ver nota de Rada Tilly).
const SPOT_TIDAL_CONFIG: Record<string, {
    rangeScale: number;  // cuánto del rango global aplica a este spot
    midPoint: number;    // offset del punto medio (0 = igual que el global)
}> = {
    "Rada Tilly": { rangeScale: 1.0, midPoint: 0 },    // referencia, mayor amplitud confirmada
    "Costanera Comodoro": { rangeScale: 0.75, midPoint: 0.05 }, // confirmado: playa chica, algo más protegida
    "Km 3": { rangeScale: 0.80, midPoint: 0 }, // sin confirmar
    "Restinga Alí": { rangeScale: 0.70, midPoint: 0.05 }, // sin confirmar
    "Caleta Córdova": { rangeScale: 1.05, midPoint: -0.05 }, // sin confirmar — ver nota de arriba, dato de "playa corta" sugeriría revisar esto
};

// Fecha local "YYYY-MM-DD". Los timestamps de Open-Meteo son instantes reales,
// así que toISOString (UTC) correría el día 3 horas.
const dayKey = (date: Date | string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getTidalPhase = (
    sea_level_height_msl: number,
    previous_sea_level_height_msl: number | undefined,
    spotName: string,
    allTidalValues: number[] = [],
    allTidalTimes: (Date | string)[] = [],
    reference: Date = new Date(),
) => {
    const config = SPOT_TIDAL_CONFIG[spotName] ?? { rangeScale: 0.75, midPoint: 0.05 };
    const isRising = previous_sea_level_height_msl != null
        ? sea_level_height_msl > previous_sea_level_height_msl
        : false;

    // El forecast trae varios días de una — acotamos al día de `reference`
    // antes de sacar mínimo/máximo. Si no tenemos los tiempos (o no matchean
    // en longitud con los valores), caemos al array completo como antes.
    const dailyValues = allTidalTimes.length === allTidalValues.length && allTidalTimes.length > 0
        ? allTidalValues.filter((_, i) => dayKey(allTidalTimes[i]) === dayKey(reference))
        : allTidalValues;

    // Sin datos horarios, usar estimación simple
    if (dailyValues.length === 0) {
        const phase = sea_level_height_msl < 0 ? 'low' : sea_level_height_msl > 1.2 ? 'high' : 'mid';
        return { phase, isRising, normalized: 0.5 };
    }

    const dailyMin = Math.min(...dailyValues);
    const dailyMax = Math.max(...dailyValues);
    const globalRange = dailyMax - dailyMin;
    const globalMid = dailyMin + globalRange / 2;

    // Rango ajustado al spot
    const spotRange = globalRange * config.rangeScale;
    const spotMin = globalMid + config.midPoint - spotRange / 2;

    const normalized = Math.min(1, Math.max(0,
        (sea_level_height_msl - spotMin) / spotRange
    ));
    const phase = normalized <= 0.55 ? 'low' : normalized > 0.8 ? 'high' : 'mid';
    return { phase, isRising, normalized };
};

export const normalizeHourly = (hourly: any): HourSnapshot[] => {
    return hourly.time.map((t: Date, i: number) => ({
        time: new Date(t),
        wind_speed: hourly.wind_speed_10m?.[i],
        wind_direction: hourly.wind_direction_10m?.[i],
        sea_level_height_msl: hourly.sea_level_height_msl?.[i]
    }));
};
export const evaluateWind = (windDir: number, beachDir: number, waveDir?: number, swellDir?: number, windSpeed?: number) => {
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

    // if (isValid(sea_level_height_msl) && sea_level_height_msl > 2.9) {
    //     return {
    //         color: "yellow",
    //         label: "MAREA ALTA",
    //         message: "Marea elevada. Precaución en zonas bajas."
    //     };
    // }

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
export const processData = (data?: MarineWeatherData, forecastData?: ForecastData, beachOrientation?: number, beachName?: string, selectedHour?: Date): CombinedConditions | null => {
    if (!data) return null;
    // if (!forecastData) return null;
    const getTime = (date: Date) => String(new Date(date).getHours()).padStart(2, "0")

    const getDate = (date: Date) => dayKey(date)
    const todaysforecast = useProcessForecast(forecastData);
    const searchTodaysStats = () => {
        if (!data) return null

        const reference = selectedHour ?? new Date()
        const today = getDate(reference)
        const now = getTime(reference)
        const index = data.daily.time.findIndex(
            (date) => getDate(date) === today
        )
        // console.log("index", index)
        const hourly = data.hourly.time.findIndex((time) => getDate(time) === today && getTime(time) === now)
        // console.log("hourly", hourly, selectedHour, now)
        if (index === -1) return null

        // El índice del forecast se busca por separado contra su propio array de tiempos,
        // porque puede tener un rango distinto al del marine API.
        const forecastHourly = forecastData
            ? forecastData.hourly.time.findIndex((time) => getDate(new Date(time)) === today && getTime(new Date(time)) === now)
            : -1

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
            swell_wave_period: data.hourly.swell_wave_period?.[hourly] ?? null,
            wind_wave_period: data.hourly.wind_wave_period?.[hourly] ?? null,
            wind_wave_direction: data.hourly.wind_wave_direction?.[hourly] ?? null,
            sea_level_height_msl: data.hourly.sea_level_height_msl?.[hourly] ?? null,
            windSpeed: forecastHourly !== -1 ? forecastData?.hourly.wind_speed_10m[forecastHourly] ?? null : null,
            windDirection: forecastHourly !== -1 ? forecastData?.hourly.wind_direction_10m[forecastHourly] ?? null : null,
            previous_sea_level_height_msl: data.hourly.sea_level_height_msl?.[hourly - 1] ?? null,
        }

        return processData ? processData : null;
    }






    const analyzeSeaState = (stats: any, spotName: string) => {
        const {
            swell_wave_height,
            wave_height,
            wind_wave_height_max,
            sea_level_height_msl,
            windSpeed,
            windDirection,
            previous_sea_level_height_msl,
        } = stats;

        const isLowWind = windSpeed < 8;
        const isLowSwell = wave_height < 0.7;
        const isShortWindWave = wind_wave_height_max < 0.5;

        // (A) Con viento offshore la ola de viento se aleja de la costa: en la orilla el mar
        // queda limpio aunque el modelo (celda mar adentro) muestre ola de viento.
        const windCond = windDirection != null
            ? evaluateWind(windDirection, beachOrientation ?? 90).windCond
            : null;
        // (B) Ola de viento real por encima del swell; evita que diferencias mínimas
        // dentro del error del modelo cuenten como mar picado.
        const windSeaExcess = (wave_height ?? 0) - (swell_wave_height ?? 0);

        let condition = "Normal";

        if (isLowWind && isLowSwell && isShortWindWave) {
            condition = "Planchado"; // Efecto espejo o "Glassy"
        }
        else if (
            windCond !== "offshore" &&
            windSpeed > 15 &&
            wave_height > swell_wave_height * 1.5 &&
            windSeaExcess >= 0.3
        ) {
            condition = "Picado"; // "Choppy"
        }

        // Evaluación de Marea para Comodoro/RT
        const tidal = getTidalPhase(
            sea_level_height_msl,
            previous_sea_level_height_msl,
            spotName,
            data?.hourly?.sea_level_height_msl ?? [],
            data?.hourly?.time ?? [],
            selectedHour ?? new Date()
        );
        let tideInfo = tidal.phase;
        // console.log("sea level", sea_level_height_msl);
        // console.log("tide info", tideInfo);

        return { condition, tideInfo, isRising: tidal.isRising };
    };
    const findClosestHourIndex = (timeArray: string[] | Date[], target: Date) => {
        if (!Array.isArray(timeArray)) return -1;

        const now = target;

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
        beachOrientation = 90,
        spotName: string
    ): SafetyStatus => {
        if (!marine?.hourly || !forecast?.hourly) return {
            color: "green",
            label: "SIN DATOS",
            message: "Datos insuficientes."
        };

        const ref = selectedHour ?? new Date();
        const marineIdx = findClosestHourIndex(marine.hourly.time, ref);
        const forecastIdx = findClosestHourIndex(forecast.hourly.time, ref);

        if (marineIdx === -1 || forecastIdx === -1) return {
            color: "green",
            label: "SIN DATOS",
            message: "Datos insuficientes."
        };

        const wind_speed = forecast.hourly.wind_speed_10m?.[forecastIdx];
        const wind_direction = forecast.hourly.wind_direction_10m?.[forecastIdx];
        const sea_level_height_msl = marine.hourly.sea_level_height_msl?.[marineIdx];
        const previous_sea_level_height_msl = marine.hourly.sea_level_height_msl?.[marineIdx - 1];
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
        const allTidal = marine.hourly.sea_level_height_msl ?? [];
        const tidal = getTidalPhase(
            Number(sea_level_height_msl),
            Number(previous_sea_level_height_msl),
            spotName,
            allTidal,
            marine.hourly.time ?? [],
            ref
        );
        // if (tidal.phase === "high") {
        //     return {
        //         color: "yellow",
        //         label: "MAREA ALTA",
        //         message: "Marea elevada. Precaución en zonas bajas."
        //     };
        // }

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





    return useMemo(() => {
        const todayStats = searchTodaysStats();
        if (!todayStats) return null;
        // console.log("today stats", data, todayStats)

        // Temporal, tiralo después de calibrar
        const allTidalValues = data.hourly.sea_level_height_msl ?? [];
        const tidal = getTidalPhase(
            Number(todayStats.sea_level_height_msl ?? 0),
            todayStats.previous_sea_level_height_msl ?? undefined,
            beachName ?? "",
            allTidalValues,
            data.hourly.time ?? [],
            selectedHour ?? new Date()
        );
        const processedData = {
            current: {
                waveHeight: todayStats.wave_height ?? undefined,
                waveDirection: todayStats.wave_direction ?? undefined,
                wavePeriod: todayStats.wind_wave_period ?? undefined,

                swellHeight: todayStats.swell_wave_height ?? undefined,
                swellDirection: todayStats.swell_wave_direction ?? undefined,
                swellPeriod: todayStats.swell_wave_period ?? undefined,

                windDirection: todayStats.windDirection ?? undefined,
                windSpeed: todayStats.windSpeed ?? undefined,
                windGusts: undefined,
                seaTemperature: undefined,
                airTemperature: undefined,
                weatherCode: undefined,

                seaLevelHeightMsl: todayStats.sea_level_height_msl ?? undefined,
                seaLevelHeightMslPrevious: todayStats.previous_sea_level_height_msl ?? undefined,
            },

            safety: getCurrentSafety(data, forecastData, beachOrientation ? beachOrientation : 90, beachName ?? ""),

            seaState: analyzeSeaState(todayStats, beachName ?? "")
        }

        return processedData;
    }, [data, forecastData, selectedHour])
}