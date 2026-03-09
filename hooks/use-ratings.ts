import React, { use } from 'react'
import { ActivityRating, ActivityType, CombinedConditions, MarineWeatherData, ForecastData, activities } from '@/lib/types'
import { getTidalPhase } from './use-processData';

export const useRatings = (
    processData: CombinedConditions | null,
    beachName: string, beachOrientation: number,
    data?: MarineWeatherData, forecastData?: ForecastData,
    selectedHour?: Date
): activities => {

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
            wave_height: data.hourly.wave_height?.[idx] ?? null,
            wave_direction: data.hourly.wave_direction?.[idx] ?? null,
            swell_wave_height: data.hourly.swell_wave_height?.[idx] ?? null,
            swell_wave_direction: data.hourly.swell_wave_direction?.[idx] ?? null,
            swell_wave_period: data.hourly.swell_wave_peak_period?.[idx] ?? null,
            wind_wave_period: data.hourly.wind_wave_period?.[idx] ?? null,
            wind_wave_height: data.hourly.wind_wave_period?.[idx] ?? null,
            sea_level_height_msl: data.hourly.sea_level_height_msl?.[idx] ?? null,
            previous_sea_level_height_msl: data.hourly.sea_level_height_msl?.[idx - 1] ?? null,
            // Viento del forecast
            windSpeed: forecastData?.hourly?.wind_speed_10m?.[idx] ?? null,
            wind_direction: forecastData?.hourly?.wind_direction_10m?.[idx] ?? null,
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

        if (score <= 2 && hasLandWind && !hasStrongWind) return {
            label: "Estar atento",
            description: "Viento de tierra — te aleja de la costa",
        };
        if (score <= 2 && hasLandWind && hasStrongWind) return {
            label: "Peligroso",
            description: "Viento de tierra — te aleja de la costa",
        };
        if (score <= 2 && hasBigWaves) return {
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
            swell_wave_height,
            swell_wave_period,
            swell_wave_period_max,
            wind_speed,
            wind_direction,
            swell_wave_direction,
            wind_wave_height,
            sea_level_height_msl,
            previous_sea_level_height_msl,
        } = stats;

        const MAX_RAW = 17;
        let score = 0;
        let factors: string[] = [];

        const windDiff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
        const swellDiff = Math.abs((swell_wave_direction - beachOrientation + 180 + 360) % 360 - 180);

        const isOffshore = windDiff > 135;
        const isOnshore = windDiff < 45;
        const swellHitsBeach = swellDiff < 85;

        /* ── GATES ────────────────────────────────────────────── */
        if (swell_wave_height < 0.6) return { score: 1, factors: ["Olas demasiado pequeñas para surfear"] };
        if (!swellHitsBeach) return { score: 1, factors: ["Swell no apunta a la playa"] };

        /* ── 1. PERÍODO — el factor más importante en surf (0–5) ── */
        const rawPeriod = swell_wave_period_max || swell_wave_period || 0;
        const period = rawPeriod > 0 ? rawPeriod : null;

        if (period === null) {
            // sin dato — no penalizar
        } else if (period >= 14) { score += 5; factors.push("Groundswell"); }
        else if (period >= 12) { score += 4; factors.push("Período largo"); }
        else if (period >= 10) { score += 3; factors.push("Período largo"); }
        else if (period >= 8) { score += 2; factors.push("Período medio"); }
        else if (period >= 7) { score += 1; factors.push("Período justo"); }
        else if (period >= 5) { score -= 1; factors.push("Ola cierra rápido"); }
        else { score -= 2; factors.push("Ola no es surfeable"); }

        /* ── 2. ALTURA (0–4) ────────────────────────────────────── */
        if (swell_wave_height >= 2.5) { score += 4; factors.push("Olas grandes"); }
        else if (swell_wave_height >= 1.5) { score += 3; factors.push("Olas medianas"); }
        else if (swell_wave_height >= 1.0) { score += 2; factors.push("Olas de tamaño decente"); }
        else if (swell_wave_height >= 0.8) { score += 1; factors.push("Olas chicas pero surfeables"); }
        // 0.6–0.8m: pasó el gate pero no suma — técnicamente surfeable, apenas

        /* ── 3. VIENTO — crítico para la forma de la ola (-5–4) ─── */
        if (isOffshore) {
            if (wind_speed <= 15) { score += 4; factors.push("Offshore perfecto"); }
            else if (wind_speed <= 30) { score += 3; factors.push("Offshore moderado"); }
            else if (wind_speed <= 50) { score += 1; factors.push("Offshore fuerte"); }
            else { score -= 2; factors.push("Offshore extremo"); }
        } else if (isOnshore) {
            if (wind_speed < 10) { score += 1; factors.push("Onshore muy leve"); }
            else if (wind_speed < 20) { score -= 1; factors.push("Onshore leve"); }
            else if (wind_speed < 30) { score -= 3; factors.push("Onshore"); }
            else { score -= 5; factors.push("Onshore fuerte"); }
        } else {
            // cross
            if (wind_speed <= 15) { score += 1; factors.push("Viento lateral leve"); }
            else if (wind_speed <= 30) { score -= 1; factors.push("Viento lateral moderado"); }
            else { score -= 3; factors.push("Viento lateral fuerte"); }
        }

        /* ── 4. ÁNGULO DEL SWELL (0–1) ──────────────────────────── */
        if (swellDiff <= 45) {
            score += 1;
            factors.push(swellDiff <= 10 ? "Swell directo" : "Ángulo de swell favorable");
        }

        /* ── 5. CHOP / WIND WAVES (-2–0) ────────────────────────── */
        if (wind_wave_height != null && swell_wave_height > 0) {
            const ratio = wind_wave_height / swell_wave_height;
            if (ratio > 0.7) { score -= 2; factors.push("Mar muy confuso"); }
            else if (ratio > 0.4) { score -= 1; factors.push("Algo de chop"); }
        }

        /* ── 6. MAREA (0–3) ──────────────────────────────────────── */
        const tide = getTidalPhase(
            sea_level_height_msl,
            previous_sea_level_height_msl,
            spotName,
            data?.hourly?.sea_level_height_msl ?? []
        );

        if (tide.phase === 'mid') { score += 2; factors.push("Marea media"); }
        else if (tide.phase === 'high') { score -= 1; factors.push("Marea alta"); }
        else { score += 1; factors.push("Marea baja"); }

        if (tide.isRising) { score += 1; factors.push("Marea subiendo"); }

        const finalScore = Math.round(Math.min(Math.max(0, (score / MAX_RAW) * 10), 10));

        return {
            score: finalScore,
            factors: [...new Set(factors)],
            isEpic: finalScore >= 9 && isOffshore,
        };
    };


    const getSupRating = (stats: any, beachOrientation: number, spotName: string) => {

        const {
            windSpeed,
            wind_direction,
            wave_height,
            swell_wave_height,
            swell_wave_direction,
            wind_wave_height,
            wind_wave_period,
            sea_level_height_msl,
            previous_sea_level_height_msl,
            wind_gusts,
        } = stats;

        const waveRef = wave_height ?? swell_wave_height ?? 0;
        const windWaveH = wind_wave_height ?? 0;
        const windWaveP = wind_wave_period ?? 99;

        const effectiveWind =
            wind_gusts != null && wind_gusts > 0
                ? Math.max(windSpeed, wind_gusts * 0.85)
                : windSpeed;

        const diff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);

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

        const isGlassy = effectiveWind < 15 && waveRef < 0.3 && windWaveH < 0.15;

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

        if (effectiveWind < 15) factors.push("Viento calmo");
        else if (effectiveWind < 25) factors.push("Viento moderado");
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

        if (windWaveH > 0.4 && windWaveP < 5) {
            chopPenalty = 0.6;
            factors.push("Mar picado");
        }
        else if (windWaveH > 0.3) {
            chopPenalty = 0.8;
            factors.push("Chop");
        }

        /* ───────────────── PENALTY RÁFAGAS ───────────────── */

        let gustPenalty = 1;

        if (wind_gusts != null) {

            if (wind_gusts - windSpeed > 20) {
                gustPenalty = 0.7;
                factors.push("Ráfagas muy fuertes");
            }
            else if (wind_gusts - windSpeed > 10) {
                gustPenalty = 0.85;
                factors.push("Ráfagas");
            }

        }

        /* ───────────────── PENALTY MAREA ───────────────── */

        const tide = getTidalPhase(
            sea_level_height_msl,
            previous_sea_level_height_msl,
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
        let score = 3;
        let factors: string[] = [];

        const windDiff = Math.abs((wind_direction - beachOrientation + 180 + 360) % 360 - 180);
        const swellDiff = swell_direction != null
            ? Math.abs((swell_direction - beachOrientation + 180 + 360) % 360 - 180)
            : null;

        const isOnshore = windDiff < 45;
        const isOffshore = windDiff > 135;
        const isCross = !isOnshore && !isOffshore;

        const totalWave = wave_height ?? Math.max(swell_wave_height ?? 0, wind_wave_height ?? 0);

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
        const tide = getTidalPhase(sea_level_height_msl, previous_sea_level_height_msl, spotName, data?.hourly?.sea_level_height_msl ?? []);
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
                previous_sea_level_height_msl: data.hourly.sea_level_height_msl[i - 1] || 0,
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
