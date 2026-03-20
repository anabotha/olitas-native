// lib/getMarineWeather.ts
import { fetchWeatherApi } from "openmeteo"
import { MarineWeatherData } from "@/lib/types"

export async function getMarineWeather(latitude: number, longitude: number): Promise<MarineWeatherData> {
    const url = "https://marine-api.open-meteo.com/v1/marine"

    const params = {
        latitude,
        longitude,
        daily: [
            "wind_wave_height_max",
            "wind_wave_direction_dominant",
            "swell_wave_period_max",
            "swell_wave_direction_dominant",
        ],
        hourly: [
            "wave_height",
            "wave_direction",
            "swell_wave_period",
            "swell_wave_height",
            "swell_wave_direction",
            "wind_wave_period",
            "wind_wave_direction",
            "sea_level_height_msl"

        ],
        timezone: "America/Sao_Paulo",
    }

    const responses = await fetchWeatherApi(url, params)
    const response = responses[0]
    const utcOffsetSeconds = response.utcOffsetSeconds()
    const hourly = response.hourly()!
    const daily = response.daily()!

    return {
        hourly: {
            time: Array.from(
                { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
                (_, i) =>
                    new Date(
                        (Number(hourly.time()) +
                            i * hourly.interval() +
                            utcOffsetSeconds) *
                        1000
                    )
            ),
            wave_height: hourly.variables(0)?.valuesArray()
                ? Array.from(hourly.variables(0)!.valuesArray()!)
                : null,
            wave_direction: hourly.variables(1)?.valuesArray()
                ? Array.from(hourly.variables(1)!.valuesArray()!)
                : null,
            swell_wave_period: hourly.variables(2)?.valuesArray()
                ? Array.from(hourly.variables(2)!.valuesArray()!)
                : null,
            swell_wave_height: hourly.variables(3)?.valuesArray()
                ? Array.from(hourly.variables(3)!.valuesArray()!)
                : null,
            swell_wave_direction: hourly.variables(4)?.valuesArray()
                ? Array.from(hourly.variables(4)!.valuesArray()!)
                : null,
            wind_wave_period: hourly.variables(5)?.valuesArray()
                ? Array.from(hourly.variables(5)!.valuesArray()!)
                : null,
            wind_wave_direction: hourly.variables(6)?.valuesArray()
                ? Array.from(hourly.variables(6)!.valuesArray()!)
                : null,
            sea_level_height_msl: hourly.variables(7)?.valuesArray()
                ? Array.from(hourly.variables(7)!.valuesArray()!)
                : null,
        },
        daily: {
            time: Array.from(
                { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
                (_, i) =>
                    new Date(
                        (Number(daily.time()) +
                            i * daily.interval() +
                            utcOffsetSeconds) *
                        1000
                    )
            ),
            wind_wave_height_max: daily.variables(0)?.valuesArray()
                ? Array.from(daily.variables(0)!.valuesArray()!)
                : null,
            wind_wave_direction_dominant: daily.variables(1)?.valuesArray()
                ? Array.from(daily.variables(1)!.valuesArray()!)
                : null,
            swell_wave_period_max: daily.variables(2)?.valuesArray()
                ? Array.from(daily.variables(2)!.valuesArray()!)
                : null,
            swell_wave_direction_dominant: daily.variables(3)?.valuesArray()
                ? Array.from(daily.variables(3)!.valuesArray()!)
                : null,
        },
    }
}