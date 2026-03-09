export interface MarineData {
  latitude: number;
  longitude: number;
  current: {
    wave_height: number;
    wave_direction: number;
    wave_period: number;
    swell_wave_height: number;
    swell_wave_direction: number;
    swell_wave_period: number;
    sea_surface_temperature: number;
  };
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    swell_wave_height: number[];
    sea_surface_temperature: number[];
  };
}

export interface MarineWeatherData {
  hourly: {
    time: Date[];
    wave_height: number[] | null;
    wave_direction: number[] | null;
    swell_wave_peak_period: number[] | null;
    swell_wave_height: number[] | null;
    swell_wave_direction: number[] | null;
    wind_wave_period: number[] | null;
    wind_wave_direction: number[] | null;
    sea_level_height_msl: number[] | null;
  };
  daily: {
    time: Date[];
    wind_wave_height_max: number[] | null;
    wind_wave_direction_dominant: number[] | null;
    swell_wave_period_max: number[] | null;
    swell_wave_direction_dominant: number[] | null;
  };
}

export interface CombinedConditions {

  current: {
    waveHeight?: number;
    waveDirection?: number;
    wavePeriod?: number;

    swellHeight?: number;
    swellDirection?: number;
    swellPeriod?: number;

    windSpeed?: number;
    windDirection?: number;
    windGusts?: number;

    seaTemperature?: number;
    airTemperature?: number;
    weatherCode?: number;

    seaLevelHeightMsl?: number;
  };

  beachOrientation?: number;
  safety: {
    color: string;
    label: string;
    message: string;
  };
  seaState: {
    condition: string;
    tideInfo: string;
    isRising?: boolean;
  };

}


export interface activities {
  activities: {
    surf: ActivityRating;
    sup: ActivityRating;
    swimming: ActivityRating;
  };
  bestWindows?: {
    surf: { time: string; score: number };
    sup: { time: string; score: number };
    swimming: { time: string; score: number };
  };
}
export interface HourlyForecast {
  time: string;
  waveHeight: number;
  windSpeed: number;
  temperature: number;
  seaTemperature: number;
  uvIndex: number;
}

export interface ActivityRating {
  score: number; // 1-5
  label: string; // "Poor" | "Fair" | "Good" | "Great" | "Epic"
  description?: string;
  factors?: string[];
}

export interface SpotLocation {
  name: string
  latitude: number
  longitude: number
  orientation: number
  country: string

  exposed: boolean

  swellWindow: {
    min: number
    max: number
  }

  windShelter?: {
    min: number
    max: number
  }
}
export type ActivityType = "surf" | "sup" | "swimming";

export interface ForecastData {
  hourly: {
    time: Date[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    pressure_msl: number[];
    wind_speed_120m: number[];
    wind_direction_10m: number[];
    wind_direction_120m: number[];
    temperature_80m: number[];
    apparent_temperature: number[];
  },
  daily: {
    time: Date[];
    uv_index_max: number[];
  },
}