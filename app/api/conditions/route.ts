import { NextRequest, NextResponse } from "next/server";
import type { CombinedConditions, HourlyForecast } from "@/lib/types";

function getCurrentIndex(times: string[]): number {
  const now = new Date();
  let closest = 0;
  let minDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  return closest;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const name = searchParams.get("name") || "Unknown Location";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Missing latitude or longitude parameters" },
      { status: 400 }
    );
  }

  try {
    // Marine API uses marine-api.open-meteo.com and only supports hourly/daily (not current)
    const marineUrl =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
      `&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period` +
      `&timezone=auto&forecast_days=2`;

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,apparent_temperature` +
      `&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,uv_index` +
      `&timezone=auto&forecast_days=2`;

    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl),
      fetch(weatherUrl),
    ]);

    // Parse responses and log errors for debugging
    const marineOk = marineRes.ok;
    const weatherOk = weatherRes.ok;

    if (!weatherOk) {
      throw new Error("Weather API failed");
    }

    const weather = await weatherRes.json();

    // Marine API may fail for inland locations - handle gracefully
    let marine: Record<string, unknown> | null = null;
    if (marineOk) {
      marine = await marineRes.json();
    }

    // Get current marine data from the hourly array (closest to now)
    const marineTimes: string[] = (marine as { hourly?: { time?: string[] } })?.hourly?.time ?? [];
    const marineHourly = (marine as { hourly?: Record<string, number[]> })?.hourly;
    const currentMarineIdx = marineTimes.length > 0 ? getCurrentIndex(marineTimes) : -1;

    const currentConditions = {
      waveHeight: currentMarineIdx >= 0 ? (marineHourly?.wave_height?.[currentMarineIdx] ?? 0) : 0,
      waveDirection: currentMarineIdx >= 0 ? (marineHourly?.wave_direction?.[currentMarineIdx] ?? 0) : 0,
      wavePeriod: currentMarineIdx >= 0 ? (marineHourly?.wave_period?.[currentMarineIdx] ?? 0) : 0,
      swellHeight: currentMarineIdx >= 0 ? (marineHourly?.swell_wave_height?.[currentMarineIdx] ?? 0) : 0,
      swellDirection: currentMarineIdx >= 0 ? (marineHourly?.swell_wave_direction?.[currentMarineIdx] ?? 0) : 0,
      swellPeriod: currentMarineIdx >= 0 ? (marineHourly?.swell_wave_period?.[currentMarineIdx] ?? 0) : 0,
      seaTemperature: 0, // Not available via marine API; would need a separate ocean temp source
      airTemperature: weather.current?.temperature_2m ?? 0,
      feelsLike: weather.current?.apparent_temperature ?? 0,
      windSpeed: weather.current?.wind_speed_10m ?? 0,
      windDirection: weather.current?.wind_direction_10m ?? 0,
      windGusts: weather.current?.wind_gusts_10m ?? 0,
      weatherCode: weather.current?.weather_code ?? 0,
    };

    // Build hourly forecast (next 12 hours)
    const now = new Date();
    const hourlyForecast: HourlyForecast[] = [];
    const weatherTimes: string[] = weather.hourly?.time ?? [];

    for (let i = 0; i < weatherTimes.length; i++) {
      const forecastTime = new Date(weatherTimes[i]);
      if (forecastTime < now) continue;
      if (hourlyForecast.length >= 12) break;

      // Find matching marine time index
      const marineIndex = marineTimes.indexOf(weatherTimes[i]);

      hourlyForecast.push({
        time: weatherTimes[i],
        waveHeight: marineIndex >= 0 ? (marineHourly?.wave_height?.[marineIndex] ?? 0) : 0,
        windSpeed: weather.hourly?.wind_speed_10m?.[i] ?? 0,
        temperature: weather.hourly?.temperature_2m?.[i] ?? 0,
        seaTemperature: 0,
        uvIndex: weather.hourly?.uv_index?.[i] ?? 0,
      });
    }


    const result: CombinedConditions = {
      location: {
        name,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      },
      current: currentConditions,
      hourlyForecast,

    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marine conditions" },
      { status: 500 }
    );
  }
}
