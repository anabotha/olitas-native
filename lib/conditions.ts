import type { ActivityRating, CombinedConditions } from "./types";

export function rateActivities(conditions: CombinedConditions["current"]): {
  surf: ActivityRating;
  sup: ActivityRating;
  swimming: ActivityRating;
} {
  return {
    surf: rateSurf(conditions),
    sup: rateSUP(conditions),
    swimming: rateSwimming(conditions),
  };
}

function rateSurf(c: CombinedConditions["current"]): ActivityRating {
  let score = 3;
  const factors: string[] = [];

  // Wave height scoring
  if (c.waveHeight < 0.3) {
    score -= 2;
    factors.push("Waves too small");
  } else if (c.waveHeight < 0.6) {
    score -= 1;
    factors.push("Small waves, beginners may enjoy");
  } else if (c.waveHeight >= 0.6 && c.waveHeight <= 2.0) {
    score += 1;
    factors.push("Great wave height for surfing");
  } else if (c.waveHeight > 2.0 && c.waveHeight <= 3.0) {
    score += 1;
    factors.push("Solid waves, experienced surfers");
  } else if (c.waveHeight > 3.0) {
    score += 0;
    factors.push("Big waves, experts only");
  }

  // Wave period scoring
  if (c.wavePeriod >= 10) {
    score += 1;
    factors.push("Clean long-period swell");
  } else if (c.wavePeriod >= 7) {
    factors.push("Decent wave period");
  } else {
    score -= 1;
    factors.push("Short choppy period");
  }

  // Wind scoring
  if (c.windSpeed < 15) {
    factors.push("Light winds, clean conditions");
  } else if (c.windSpeed < 25) {
    score -= 1;
    factors.push("Moderate wind, some chop");
  } else {
    score -= 2;
    factors.push("Strong winds, blown out");
  }

  return {
    score: clampScore(score),
    ...getLabel(clampScore(score)),
    factors,
  };
}

function rateSUP(c: CombinedConditions["current"]): ActivityRating {
  let score = 3;
  const factors: string[] = [];

  // Wave height (SUP prefers calm)
  if (c.waveHeight < 0.3) {
    score += 1;
    factors.push("Flat water, perfect for paddling");
  } else if (c.waveHeight < 0.6) {
    score += 1;
    factors.push("Light chop, still good");
  } else if (c.waveHeight < 1.0) {
    factors.push("Moderate waves, be cautious");
  } else if (c.waveHeight < 1.5) {
    score -= 1;
    factors.push("Challenging waves for SUP");
  } else {
    score -= 2;
    factors.push("Too wavy for safe SUP");
  }

  // Wind scoring (SUP very sensitive to wind)
  if (c.windSpeed < 10) {
    score += 1;
    factors.push("Calm winds, ideal paddling");
  } else if (c.windSpeed < 20) {
    factors.push("Some wind, manageable");
  } else if (c.windSpeed < 30) {
    score -= 1;
    factors.push("Windy, difficult to paddle");
  } else {
    score -= 2;
    factors.push("Too windy for safe paddling");
  }

  // Temperature
  if (c.airTemperature > 20) {
    factors.push("Warm weather, enjoy the paddle");
  } else if (c.airTemperature > 12) {
    factors.push("Mild temperature, dress warmly");
  } else {
    score -= 1;
    factors.push("Cold conditions, wetsuit needed");
  }

  return {
    score: clampScore(score),
    ...getLabel(clampScore(score)),
    factors,
  };
}

function rateSwimming(c: CombinedConditions["current"]): ActivityRating {
  let score = 3;
  const factors: string[] = [];

  // Temperature - use sea temp if available, else air temp as proxy
  const waterTemp = c.seaTemperature > 0 ? c.seaTemperature : c.airTemperature;
  const tempLabel = c.seaTemperature > 0 ? "water" : "air";
  if (waterTemp >= 20) {
    score += 1;
    factors.push(`Warm ${tempLabel} temp (${waterTemp.toFixed(0)}\u00B0C)`);
  } else if (waterTemp >= 16) {
    factors.push(`Cool ${tempLabel} temp, wetsuit recommended`);
  } else if (waterTemp >= 12) {
    score -= 1;
    factors.push(`Cold ${tempLabel} temp, wetsuit required`);
  } else {
    score -= 2;
    factors.push(`Very cold (${waterTemp.toFixed(0)}\u00B0C), thick wetsuit essential`);
  }

  // Wave height
  if (c.waveHeight < 0.5) {
    score += 1;
    factors.push("Calm seas, great for swimming");
  } else if (c.waveHeight < 1.0) {
    factors.push("Slight waves, be mindful");
  } else if (c.waveHeight < 1.5) {
    score -= 1;
    factors.push("Moderate waves, experienced swimmers");
  } else {
    score -= 2;
    factors.push("Rough seas, not recommended");
  }

  // Wind
  if (c.windSpeed < 15) {
    factors.push("Light winds, pleasant conditions");
  } else if (c.windSpeed < 25) {
    factors.push("Some wind chill to expect");
  } else {
    score -= 1;
    factors.push("Strong winds, uncomfortable");
  }

  return {
    score: clampScore(score),
    ...getLabel(clampScore(score)),
    factors,
  };
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(5, score));
}

function getLabel(score: number): { label: string; description: string } {
  switch (score) {
    case 1:
      return { label: "Poor", description: "Not recommended today" };
    case 2:
      return { label: "Fair", description: "Conditions are below average" };
    case 3:
      return { label: "Good", description: "Decent conditions, have fun" };
    case 4:
      return { label: "Great", description: "Really good conditions today" };
    case 5:
      return { label: "Epic", description: "Perfect day, get out there!" };
    default:
      return { label: "Good", description: "Decent conditions" };
  }
}

export function getWindDirectionLabel(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index];
}

export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] || "Unknown";
}
