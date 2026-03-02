// lib/getMarineWeather.ts
import { fetchWeatherApi } from "openmeteo"
import { ForecastData } from "@/lib/types"
export async function getForecast(latitude: number, longitude: number): Promise<ForecastData> {
    const url = "https://api.open-meteo.com/v1/forecast";

    const params = {
        latitude,
        longitude,
        daily: "uv_index_max",
        hourly: [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "pressure_msl",
            "wind_speed_120m",
            "wind_direction_10m",
            "wind_direction_120m",
            "temperature_80m",
            "apparent_temperature"
        ],
    };

    const responses = await fetchWeatherApi(url, params);

    if (!responses || responses.length === 0 || !responses[0]) {
        throw new Error("No se recibieron datos de la API de Open Meteo");
    }

    const response = responses[0];
    // Validar que los métodos existen
    const elevation = typeof response.elevation === "function" ? response.elevation() : 0;
    const utcOffsetSeconds = typeof response.utcOffsetSeconds === "function" ? response.utcOffsetSeconds() : 0;

    const hourly = response.hourly?.();
    const daily = response.daily?.();

    if (!hourly || !daily) {
        throw new Error("No hay datos horarios o diarios disponibles");
    }

    const weatherData: ForecastData = {
        hourly: {
            time: Array.from(
                { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
                (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
            ),
            temperature_2m: Array.from(hourly.variables(0)?.valuesArray() ?? []),
            relative_humidity_2m: Array.from(hourly.variables(1)?.valuesArray() ?? []),
            wind_speed_10m: Array.from(hourly.variables(2)?.valuesArray() ?? []),
            pressure_msl: Array.from(hourly.variables(3)?.valuesArray() ?? []),
            wind_speed_120m: Array.from(hourly.variables(4)?.valuesArray() ?? []),
            wind_direction_10m: Array.from(hourly.variables(5)?.valuesArray() ?? []),
            wind_direction_120m: Array.from(hourly.variables(6)?.valuesArray() ?? []),
            temperature_80m: Array.from(hourly.variables(7)?.valuesArray() ?? []),
            apparent_temperature: Array.from(hourly.variables(8)?.valuesArray() ?? []),
        },
        daily: {
            time: Array.from(
                { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
                (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
            ),
            uv_index_max: Array.from(daily.variables(0)?.valuesArray() ?? []),
        },
    };

    return weatherData;
}