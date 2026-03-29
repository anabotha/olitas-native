// useCurrentSafety.ts

import { CombinedConditions, MarineWeatherData, ForecastData, SpotLocation } from "@/lib/types"
import { evaluateWind, getTidalPhase, isValid,SafetyStatus } from './use-processData'
export const useCurrentSafety = (
    marine: MarineWeatherData |undefined,
    forecast: ForecastData |undefined,
    spot: SpotLocation,
    selectedHour?: Date
): SafetyStatus => {

    if (!marine?.hourly || !forecast?.hourly) return {
        color: "green",
        label: "SIN DATOS",
        message: "Datos insuficientes."
    };
const findClosestHourIndex = (timeArray: Date[], target: Date): number => {
    const targetMs = target.getTime();
    let closest = -1;
    let minDiff = Infinity;
    for (let i = 0; i < timeArray.length; i++) {
        const diff = Math.abs(new Date(timeArray[i]).getTime() - targetMs);
        if (diff < minDiff) { minDiff = diff; closest = i; }
    }
    return minDiff <= 60 * 60 * 1000 ? closest : -1;
};
    const targetHour = selectedHour ?? new Date();

    const marineIdx = findClosestHourIndex(marine.hourly.time, targetHour);
    const forecastIdx = findClosestHourIndex(forecast.hourly.time, targetHour);

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

    const beachOrientation = spot.orientation ?? 90;
    const { windCond } = evaluateWind(wind_direction, beachOrientation);

    // OFFSHORE
    if (windCond === "offshore") {
        if (wind_speed > 45) return {
            color: "red",
            label: "PELIGRO",
            message: "Offshore muy fuerte. Riesgo de deriva mar adentro."
        };
        if (wind_speed > 30) return {
            color: "yellow",
            label: "PRECAUCIÓN",
            message: "Offshore moderado. Atención a corrientes."
        };
    }

    // ONSHORE
    if (windCond === "onshore") {
        if (wind_speed > 45) return {
            color: "red",
            label: "MUY PELIGROSO",
            message: "Viento fuerte entrando al mar. Shorebreak caótico."
        };
        if (wind_speed > 30) return {
            color: "yellow",
            label: "PRECAUCIÓN",
            message: "Viento entrando al mar. Condiciones inestables."
        };
    }

    // ALERTAS GENERALES
    if (wind_speed > 80) return {
        color: "red",
        label: "PELIGRO",
        message: "ALERTA ROJA POR VIENTO FUERTE"
    };
    if (wind_speed > 55) return {
        color: "red",
        label: "PELIGRO",
        message: "ALERTA AMARILLA POR VIENTO FUERTE"
    };

    // MAREA
    const allTidal = marine.hourly.sea_level_height_msl ?? [];
    const tidal = getTidalPhase(
        Number(sea_level_height_msl),
        Number(previous_sea_level_height_msl),
        spot.name,
        allTidal
    );

    // if (tidal.phase === "high") return {
    //     color: "yellow",
    //     label: "MAREA ALTA",
    //     message: "Marea elevada. Precaución en zonas bajas."
    // };

    if (wind_speed > 44) return {
        color: "yellow",
        label: "ALERTA",
        message: "Viento fuerte en la zona."
    };

    return {
        color: "green",
        label: "SEGURO",
        message: "Condiciones de seguridad normales."
    };
};