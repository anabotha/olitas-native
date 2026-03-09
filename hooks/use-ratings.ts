import React, { use } from 'react'
import { ActivityRating, ActivityType, CombinedConditions, MarineWeatherData, ForecastData, activities } from '@/lib/types'
import { getTidalPhase } from './use-processData';

export const useRatings = (
    processData: CombinedConditions | null,
    beachName: string, beachOrientation: number,
    data?: MarineWeatherData, forecastData?: ForecastData,
    selectedHour?: Date
): activities => {
    console.log(processData)
    /** Busca el índice en data.hourly.time más cercano a `target` */
    const findHourIndex = (timeArray: Date[], target: Date): number => {
        const targetMs = target.getTime();
        let closest = -1;
        let minDiff = Infinity;
        for (let i = 0; i < timeArray.length; i++) {
            const diff = Math.abs(new Date(timeArray[i]).getTime() - targetMs);
            if (diff < minDiff) { minDiff = diff; closest = i; }
        }
        // Aceptamos si está dentro de 1 hora
        return minDiff <= 60 * 60 * 1000 ? closest : -1;
    };

    /** Arma los stats para la hora seleccionada desde los datos raw */
    const buildStatsForHour = (): any | null => {
        if (!data || !selectedHour) return null;

        const idx = findHourIndex(data.hourly.time, selectedHour);
        if (idx === -1) return null;

        return {
            waveHeight: data.hourly.wave_height?.[idx] ?? null,
            waveDirection: data.hourly.wave_direction?.[idx] ?? null,
            swellHeight: data.hourly.swell_wave_height?.[idx] ?? null,
            swellDirection: data.hourly.swell_wave_direction?.[idx] ?? null,
            swellPeriod: data.hourly.swell_wave_peak_period?.[idx] ?? null,
            wavePeriod: data.hourly.wind_wave_period?.[idx] ?? null,
            seaLevelHeightMsl: data.hourly.sea_level_height_msl?.[idx] ?? null,
            seaLevelHeightMslPrevious: data.hourly.sea_level_height_msl?.[idx - 1] ?? null,
            // Viento del forecast
            windSpeed: forecastData?.hourly?.wind_speed_10m?.[idx] ?? null,
            windDirection: forecastData?.hourly?.wind_direction_10m?.[idx] ?? null,
        };
    };

    // Stats para la hora seleccionada, o fallback a processData.current
    const hourlyStats = buildStatsForHour() ?? processData?.current;



    const getRating = (
        stats: any,
        activity: ActivityType,
        beachOrientation: number,
        spotName: string
    ): ActivityRating | null => {

        switch (activity) {
            case "surf": {
                const { score, factors } = getSurfRating(stats, beachOrientation, spotName);
                return { ...getLabelSurf(score, factors), factors, score };
            }

            case "sup": {
                const { score, factors } = getSupRating(stats, beachOrientation, spotName);
                return { ...getLabelSup(score, factors), factors, score };
            }

            case "swimming": {
                const { score, factors } = getSwimmingRating(stats, beachOrientation, spotName);
                return { ...getLabelSwimming(score, factors), factors, score };
            }
            default: {
                return null;
            }
        }
    };


    const getLabel = (score: number): Partial<ActivityRating> => {
        if (score <= 1) {
            return {
                label: "Malo",
                description: "No se dan las condiciones",
            };
        }

        if (score <= 4) {
            return {
                label: "Jodido",
                description: "Se puede, pero no destaca",
            };
        }

        if (score <= 6) {
            return {
                label: "Bien",
                description: "Condiciones bastante decentes",
            };
        }

        if (score <= 8) {
            return {
                label: "Muy bueno",
                description: "Agarra el traje",
            };
        }

        return {
            label: "Excelente",
            description: "Día ideal",
        };
    };
    const getLabelSurf = (score: number, factors: string[]): Partial<ActivityRating> => {

        // Casos especiales — condiciones contradictorias
        const hasWaves = factors.some(f => f.includes("Olas") || f.includes("potente") || f.includes("grande"));
        const isDestroyed = factors.some(f => f.includes("destruida") || f.includes("confuso") || f.includes("sin forma"));
        const periodBad = factors.some(f => f.includes("no es surfeable") || f.includes("cierra rápido"));

        if (score <= 2 && hasWaves && isDestroyed) {
            return {
                label: "Jodido",
                description: "Hay olas pero el viento las arruina",
            };
        }

        if (score <= 2 && hasWaves && periodBad) {
            return {
                label: "Jodido",
                description: "Hay olas pero cierran todas",
            };
        }

        // Labels normales
        if (score <= 1) return { label: "Malo", description: "No se dan las condiciones" };
        if (score <= 2) return { label: "Malo", description: "No vale la pena" };
        if (score <= 4) return { label: "Flojo", description: "Se puede, pero no destaca" };
        if (score <= 6) return { label: "Bien", description: "Condiciones bastante decentes" };
        if (score <= 8) return { label: "Muy bueno", description: "Agarra el traje" };

        return { label: "Excelente", description: "Día ideal" };
    };

    const getLabelSup = (score: number, factors: string[]): Partial<ActivityRating> => {

        const isDangerous = factors.some(f => f.includes("Peligro") || f.includes("extremo"));
        const isGlassy = factors.some(f => f.includes("Espejo"));
        const hasStrongWind = factors.some(f => f.includes("Viento fuerte") || f.includes("Ráfagas muy fuertes"));
        const hasLandWind = factors.some(f => f.includes("Viento de tierra"));
        const hasBigWaves = factors.some(f => f.includes("Olas grandes") || f.includes("Olas muy grandes"));

        if (isDangerous) return {
            label: "Peligroso",
            description: "No salir al agua",
        };

        if (isGlassy) return {
            label: "Espejo",
            description: "Condiciones perfectas para remar",
        };
        if (score <= 2 && hasLandWind && hasStrongWind) return {
            label: "Peligroso",
            description: "Viento de tierra — te aleja de la costa",
        };

        if (score <= 3 && hasLandWind && !hasStrongWind) return {
            label: "Estar atento",
            description: "Viento de tierra — te aleja de la costa",
        };
        if (score <= 3 && hasBigWaves) return {
            label: "Exigente",
            description: "Olas grandes — solo para expertos",
        };

        if (score <= 2) return {
            label: "Malo",
            description: "No se dan las condiciones",
        };

        if (score <= 4 && hasStrongWind) return {
            label: "Ventoso",
            description: "Difícil mantener el rumbo",
        };

        if (score <= 4) return {
            label: "Flojo",
            description: "Se puede, pero cuesta",
        };

        if (score <= 6) return {
            label: "Bien",
            description: "Buena sesión de remo",
        };

        if (score <= 8) return {
            label: "Muy bueno",
            description: "Agarra la tabla",
        };

        return {
            label: "Excelente",
            description: "Día ideal para remar",
        };
    };

    const getLabelSwimming = (score: number, factors: string[]): Partial<ActivityRating> => {

        const isDangerous = factors.some(f => f.includes("⚠️") || f.includes("peligroso"));
        const hasRipCurrent = factors.some(f => f.includes("resaca"));
        const hasLateralCurrent = factors.some(f => f.includes("lateral fuerte"));
        const hasRoughSea = factors.some(f => f.includes("agitado") || f.includes("Corderitos"));
        const hasHighWaves = factors.some(f => f.includes("Oleaje alto") || f.includes("Oleaje peligroso"));
        const isFlat = factors.some(f => f.includes("planchado") || f.includes("Mar planchado"));

        if (hasRipCurrent) return {
            label: "Peligroso",
            description: "Riesgo de corriente de resaca",
        };

        if (hasLateralCurrent) return {
            label: "Peligroso",
            description: "Corriente lateral — no entrar",
        };

        if (score <= 2 && hasHighWaves) return {
            label: "Jodido",
            description: "Oleaje demasiado alto para nadar",
        };

        if (score <= 2) return {
            label: "Malo",
            description: "No se dan las condiciones",
        };

        if (score <= 4 && hasRoughSea) return {
            label: "Agitado",
            description: "Mar movido — solo nadadores con experiencia",
        };

        if (score <= 4 && hasHighWaves) return {
            label: "Con olas",
            description: "Oleaje moderado — con precaución",
        };

        if (score <= 4) return {
            label: "Flojo",
            description: "Se puede, pero no es ideal",
        };

        if (score <= 6 && isFlat) return {
            label: "Tranquilo",
            description: "Mar calmo — ideal para nadar",
        };

        if (score <= 6) return {
            label: "Bien",
            description: "Buenas condiciones para nadar",
        };

        if (score <= 8) return {
            label: "Muy bueno",
            description: "Agua en buenas condiciones",
        };

        return {
            label: "Excelente",
            description: "Día ideal para nadar",
        };
    };

    const getSurfRating = (stats: any, beachOrientation: number, spotName: string) => {

        const {
            swellHeight,
            swellPeriod,
            wavePeriod,
            windSpeed,
            windDirection,
            swellDirection,
            waveHeight,
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
        } = stats;

        const MAX_RAW = 20;
        let score = 0;
        let factors: string[] = [];

        if (windDirection == null || swellDirection == null) {
            return { score: 0, factors: ["Datos incompletos"] };
        }

        const windDiff = Math.abs((windDirection - beachOrientation + 540) % 360 - 180);
        const swellDiff = Math.abs((swellDirection - beachOrientation + 540) % 360 - 180);

        const isOffshore = windDiff > 135;
        const isOnshore = windDiff < 45;

        const swellHitsBeach = swellDiff < 100;

        const period = swellPeriod ?? wavePeriod ?? null;

        /* ── GATES ───────────────────────────────────── */

        if (swellHeight < 0.6) {
            return { score: 1, factors: ["Olas demasiado pequeñas"] };
        }

        if (!swellHitsBeach) {
            return { score: 1, factors: ["Swell no entra a la playa"] };
        }

        /* ── ENERGÍA DEL SWELL (height × period) ─────── */

        if (period != null) {

            const energy = swellHeight * period;

            if (energy >= 18) {
                score += 5;
                factors.push("Swell potente");
            }
            else if (energy >= 13) {
                score += 4;
                factors.push("Swell sólido");
            }
            else if (energy >= 9) {
                score += 3;
                factors.push("Swell consistente");
            }
            else if (energy >= 6) {
                score += 2;
                factors.push("Swell moderado");
            }
            else {
                score += 1;
                factors.push("Swell débil");
            }

        }

        /* ── ALTURA DEL SWELL ───────────────────────── */

        if (swellHeight >= 2.8) {
            score += 4;
            factors.push("Olas grandes");
        }
        else if (swellHeight >= 1.8) {
            score += 3;
            factors.push("Olas sólidas");
        }
        else if (swellHeight >= 1.2) {
            score += 2;
            factors.push("Olas decentes");
        }
        else if (swellHeight >= 0.9) {
            score += 1;
            factors.push("Olas chicas pero surfeables");
        }

        /* ── VIENTO (adaptado Patagonia) ───────────── */

        if (isOffshore) {

            if (windSpeed <= 20) {
                score += 4;
                factors.push("Offshore limpio");
            }
            else if (windSpeed <= 35) {
                score += 3;
                factors.push("Offshore moderado");
            }
            else if (windSpeed <= 55) {
                score += 1;
                factors.push("Offshore fuerte");
            }
            else {
                score -= 2;
                factors.push("Offshore extremo");
            }

        }

        else if (isOnshore) {

            if (windSpeed <= 12) {
                score += 1;
                factors.push("Onshore leve");
            }
            else if (windSpeed <= 22) {
                score -= 1;
                factors.push("Onshore moderado");
            }
            else if (windSpeed <= 35) {
                score -= 3;
                factors.push("Ola desordenada por viento");
            }
            else {
                score -= 4;
                factors.push("Mar destruido por viento");
            }

        }

        else {

            if (windSpeed <= 18) {
                score += 1;
                factors.push("Viento lateral leve");
            }
            else if (windSpeed <= 30) {
                score -= 1;
                factors.push("Viento lateral");
            }
            else {
                score -= 3;
                factors.push("Viento lateral fuerte");
            }

        }

        /* ── ÁNGULO DEL SWELL ─────────────────────── */

        if (swellDiff <= 45) {

            score += 1;

            if (swellDiff <= 12) {
                factors.push("Swell directo");
            } else {
                factors.push("Ángulo favorable");
            }

        }

        /* ── CHOP / WIND WAVES ───────────────────── */

        if (waveHeight != null && swellHeight > 0) {

            const ratio = waveHeight / swellHeight;

            if (ratio > 1.2) {
                score -= 2;
                factors.push("Mar confuso");
            }
            else if (ratio > 0.85) {
                score -= 1;
                factors.push("Algo de viento en el mar");
            }

        }

        /* ── MAREA ───────────────────────────────── */

        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spotName,
            data?.hourly?.sea_level_height_msl ?? []
        );

        if (tide.phase === "mid") {
            score += 2;
            factors.push("Marea media");
        }
        else if (tide.phase === "high") {
            score -= 1;
            factors.push("Marea alta");
        }
        else {
            score += 1;
            factors.push("Marea baja");
        }

        if (tide.isRising) {
            score += 1;
            factors.push("Marea subiendo");
        }

        /* ── NORMALIZACIÓN ───────────────────────── */

        const finalScore = Math.round(
            Math.min(Math.max(0, (score / MAX_RAW) * 10), 10)
        );

        return {
            score: finalScore,
            factors: [...new Set(factors)],
            isEpic: finalScore >= 9 && isOffshore,
        };

    };

    const getSupRating = (stats: any, beachOrientation: number, spotName: string) => {

        const {
            windSpeed,
            windDirection,
            waveHeight,
            swellHeight,
            swellDirection,
            wavePeriod,
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
        } = stats;

        const waveRef = waveHeight ?? swellHeight ?? 0;
        const windWaveP = wavePeriod ?? 99;

        const effectiveWind = windSpeed;

        const diff = Math.abs((windDirection - beachOrientation + 180 + 360) % 360 - 180);

        const isOffshore = diff > 135;
        const isOnshore = diff < 45;
        const isCross = !isOnshore && !isOffshore;

        const factors: string[] = [];

        /* ───────────────── HARD STOPS ───────────────── */

        if (isOffshore && effectiveWind > 22) {
            return {
                score: 0,
                factors: ["Peligro: viento de tierra fuerte"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        if (effectiveWind > 55) {
            return {
                score: 0,
                factors: ["Viento extremo"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        /* ───────────────── GLASSY DETECTION ───────────────── */

        const isGlassy = effectiveWind < 15 && waveRef < 0.3;

        if (isGlassy) {
            return {
                score: 10,
                factors: ["Espejo"],
                dangerLevel: "NONE",
                isGlassy: true,
            };
        }

        /* ───────────────── BASE SCORE (VIENTO) ───────────────── */

        let windScore = 0;

        if (effectiveWind < 10) windScore = 10;
        else if (effectiveWind < 15) windScore = 9;
        else if (effectiveWind < 20) windScore = 7;
        else if (effectiveWind < 30) windScore = 5;
        else if (effectiveWind < 40) windScore = 3;
        else windScore = 1;

        if (effectiveWind < 19) factors.push("Viento calmo");
        else if (effectiveWind < 29) factors.push("Viento moderado");
        else factors.push("Viento fuerte");

        /* ───────────────── DIRECCIÓN ───────────────── */

        let directionMultiplier = 1;

        if (isOnshore) {
            directionMultiplier = 1;
        }
        else if (isCross) {
            directionMultiplier = effectiveWind < 20 ? 0.9 : 0.7;
            factors.push("Viento lateral");
        }
        else if (isOffshore) {
            directionMultiplier = effectiveWind < 15 ? 0.8 : 0.4;
            factors.push("Viento de tierra");
        }

        let baseScore = windScore * directionMultiplier;

        /* ───────────────── PENALTY OLAS ───────────────── */

        let wavePenalty = 1;

        if (waveRef < 0.5) wavePenalty = 1;
        else if (waveRef < 1) {
            wavePenalty = 0.9;
            factors.push("Olas pequeñas");
        }
        else if (waveRef < 1.5) {
            wavePenalty = 0.7;
            factors.push("Olas medianas");
        }
        else if (waveRef < 2) {
            wavePenalty = 0.5;
            factors.push("Olas grandes");
        }
        else {
            wavePenalty = 0.3;
            factors.push("Olas muy grandes");
        }

        /* ───────────────── PENALTY CHOP ───────────────── */

        let chopPenalty = 1;

        if (waveRef > 0.4 && windWaveP < 5) {
            chopPenalty = 0.6;
            factors.push("Mar picado");
        }
        else if (waveRef > 0.3) {
            chopPenalty = 0.8;
            factors.push("Chop");
        }

        /* ───────────────── PENALTY RÁFAGAS ───────────────── */

        let gustPenalty = 1;

        /* ───────────────── PENALTY MAREA ───────────────── */

        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spotName,
            data?.hourly?.sea_level_height_msl ?? []
        );

        let tidePenalty = 1;

        if (tide.phase === "mid") {
            factors.push("Marea media");
        }
        else if (tide.phase === "low") {
            tidePenalty = 0.85;
            factors.push("Marea baja");
        }

        /* ───────────────── SCORE FINAL ───────────────── */

        let finalScore =
            baseScore *
            wavePenalty *
            chopPenalty *
            gustPenalty *
            tidePenalty;

        finalScore = Math.round(Math.max(0, Math.min(finalScore, 10)));
        return {
            score: finalScore,
            factors: [...new Set(factors)],
            dangerLevel: finalScore <= 2 ? "MEDIUM" : "NORMAL",
            isGlassy,
        };

    };

    const getSwimmingRating = (stats: any, beachOrientation: number, spotName: string) => {
        const {

            windSpeed,
            windDirection,
            waveHeight,
            wavePeriod,
            swellHeight,
            swellDirection,
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
        } = stats;

        const MAX_RAW = 12;
        let score = 3;
        let factors: string[] = [];

        const windDiff = Math.abs((windDirection - beachOrientation + 180 + 360) % 360 - 180);
        const swellDiff = swellDirection != null
            ? Math.abs((swellDirection - beachOrientation + 180 + 360) % 360 - 180)
            : null;

        const isOnshore = windDiff < 45;
        const isOffshore = windDiff > 135;
        const isCross = !isOnshore && !isOffshore;

        const totalWave = waveHeight ?? (swellHeight ?? 0);

        /* ── 3. OLEAJE (0–3) ─────────────────────────────────── */
        if (totalWave < 0.2) { score += 3; factors.push("Mar planchado"); }
        else if (totalWave < 0.5) { score += 2; }
        else if (totalWave < 0.9) { score += 1; }
        else if (totalWave < 1.0) { score -= 0.5; factors.push("Oleaje moderado"); }
        else if (totalWave < 1.2) { score -= 1; factors.push("Oleaje moderado"); }
        else if (totalWave < 1.5) { score -= 2; factors.push("Oleaje alto"); }
        else { score -= 3; factors.push("Oleaje peligroso"); }

        /* ── 4. VIENTO / CHOP (0–2) — km/h ──────────────────── */
        if (windSpeed < 15) { score += 2; }
        else if (windSpeed < 28 && !isOnshore) { score += 1; }
        else if (isOnshore && windSpeed >= 28) { score -= 1; factors.push("Corderitos"); factors.push("Mar agitado"); }
        else if (isOffshore && windSpeed < 28) { score += 1; factors.push("Viento de tierra"); factors.push("Mar planchado"); }

        /* ── 5. CORRIENTES — km/h ────────────────────────────── */
        const tide = getTidalPhase(seaLevelHeightMsl, seaLevelHeightMslPrevious, spotName, data?.hourly?.sea_level_height_msl ?? []);
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
        else if (tide.phase === 'low') { factors.push("Marea baja"); }

        /* ── 7. LLUVIA / UV (0–1) ────────────────────────────── */
        score += 1;

        const finalScore = Math.round(Math.min(Math.max(0, (score / MAX_RAW) * 10), 10));
        return {
            score: finalScore,
            factors: [...new Set(factors)],
            windType: isOnshore ? 'Onshore' : isOffshore ? 'Offshore' : 'Cross-shore',
            dangerLevel: finalScore <= 2 ? 'HIGH' : finalScore <= 4 ? 'MEDIUM' : 'NORMAL',
        };
    };
    const getBestWindow = (data: any, activity: ActivityType, beachOrientation?: number) => {
        const nowIndex = data.hourly.time.findIndex(t => new Date(t) >= new Date());
        let bestHour = null;
        let maxScore = -1;
        // Recorremos las próximas 24 horas
        for (let i = nowIndex; i < nowIndex + 24 && i < data.hourly.time.length; i++) {
            const hourlyStats = {
                waveHeight: data.hourly.wave_height[i],
                waveDirection: data.hourly.wave_direction[i],
                swellHeight: data.hourly.swell_wave_height[i],
                swellDirection: data.hourly.swell_wave_direction[i],
                swellPeriod: data.hourly.swell_wave_peak_period?.[i] || 0,
                wavePeriod: data.hourly.wind_wave_period?.[i] || 0,
                windSpeed: data.hourly.wind_speed_10m?.[i] || 0,
                windDirection: data.hourly.windDirection_10m?.[i],
                seaLevelHeightMsl: data.hourly.sea_level_height_msl[i],
                seaLevelHeightMslPrevious: data.hourly.sea_level_height_msl[i - 1] || 0,
            };

            const { score } = activity === "surf" ? getSurfRating(hourlyStats, beachOrientation ? beachOrientation : 90, beachName) :
                activity === "sup" ? getSupRating(hourlyStats, beachOrientation ? beachOrientation : 90, beachName) :
                    getSwimmingRating(hourlyStats, beachOrientation ? beachOrientation : 90, beachName);

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
    return {

        activities: {
            surf: getRating(hourlyStats, "surf", beachOrientation, beachName),
            sup: getRating(hourlyStats, "sup", beachOrientation, beachName),
            swimming: getRating(hourlyStats, "swimming", beachOrientation, beachName),
        },
        ...(data ? {
            bestWindows: {
                surf: getBestWindow(data, "surf", beachOrientation ? beachOrientation : 90),
                sup: getBestWindow(data, "sup", beachOrientation ? beachOrientation : 90),
                swimming: getBestWindow(data, "swimming", beachOrientation ? beachOrientation : 90)
            },
        } : {}),
    }
}
