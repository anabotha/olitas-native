import React, { use } from 'react'
import { ActivityRating, ActivityType, CombinedConditions, MarineWeatherData, ForecastData, activities, SpotLocation } from '@/lib/types'
import { getTidalPhase } from './use-processData';
import { angleDiff, inAngleWindow, classifyWind } from '@/lib/geometry';
import { RatingResult, clampScore, normalize, dangerFromScore, dedupe, applyShelter, tideWindowScore } from '@/lib/scoring';
import { SURF_CONFIG, SUP_CONFIG, SWIM_CONFIG } from './rating-config';

/** Ráfagas fuertes: superan el umbral absoluto o (si hay `spread`) se despegan mucho del viento medio */
const hasStrongGusts = (
    windSpeed: number,
    windGusts: number | null | undefined,
    limits: { strong: number; spread?: number }
): boolean =>
    windGusts != null &&
    (windGusts >= limits.strong || (limits.spread != null && windGusts - windSpeed >= limits.spread));

const degToCompass = (deg: number) => {
    const directions = ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"];
    const index = Math.floor(((deg + 22.5) / 45)) % 8;
    return directions[index];
};

export const useRatings = (
    processData: CombinedConditions | null,
    beachName: string, beachOrientation: number,
    spot: SpotLocation,
    data?: MarineWeatherData,
    forecastData?: ForecastData,
    selectedHour?: Date,
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

        // El forecast tiene su propio array de tiempos — buscamos su índice de forma independiente
        const forecastIdx = forecastData
            ? findHourIndex(forecastData.hourly.time as unknown as Date[], selectedHour)
            : -1;

        return {
            waveHeight: data.hourly.wave_height?.[idx] ?? null,
            waveDirection: data.hourly.wave_direction?.[idx] ?? null,
            swellHeight: data.hourly.swell_wave_height?.[idx] ?? null,
            swellDirection: data.hourly.swell_wave_direction?.[idx] ?? null,
            swellPeriod: data.hourly.swell_wave_period?.[idx] ?? null,
            wavePeriod: data.hourly.wind_wave_period?.[idx] ?? null,
            seaLevelHeightMsl: data.hourly.sea_level_height_msl?.[idx] ?? null,
            seaLevelHeightMslPrevious: data.hourly.sea_level_height_msl?.[idx - 1] ?? null,
            // Viento del forecast — índice propio
            windSpeed: forecastIdx !== -1 ? forecastData?.hourly?.wind_speed_10m?.[forecastIdx] ?? null : null,
            windDirection: forecastIdx !== -1 ? forecastData?.hourly?.wind_direction_10m?.[forecastIdx] ?? null : null,
            windGusts: forecastIdx !== -1 ? forecastData?.hourly?.wind_gusts_10m?.[forecastIdx] ?? null : null,
        };
    };

    // Stats para la hora seleccionada, o fallback a processData.current
    const hourlyStats = buildStatsForHour() ?? processData?.current;
    // const nowStats = processData?.current;

    const getRating = (
        stats: any,
        activity: ActivityType,
        beachOrientation: number,
        spotName: string,
        spot: SpotLocation
    ): ActivityRating => {
        switch (activity) {
            case "surf": {
                const { score, factors } = getSurfRating(hourlyStats, spotName, spot);
                return { ...getLabelSurf(score, factors), factors, score };
            }

            case "sup": {
                const { score, factors } = getSupRating(hourlyStats, spot);

                return { ...getLabelSup(score, factors), factors, score };
            }

            case "swimming": {
                const { score, factors, dangerLevel } = getSwimmingRating(hourlyStats, spot);
                return { ...getLabelSwimming(score, factors, dangerLevel), factors, score };
            }

        }
    };



    const getLabelSwimming = (
        score: number,
        factors: string[],
        dangerLevel?: string
    ): { label: string; description: string } => {

        const hasRipCurrent = factors.some(f => f.includes("resaca"))
        const hasOffshoreWind = factors.some(f => f.includes("al mar"))
        const hasHighWaves = factors.some(f => f.includes("muy fuerte"))
        const hasLateralCurrent = factors.some(f => f.includes("lateral"))
        const hasRoughSea = factors.some(f => f.includes("revuelto") || f.includes("picado"))
        const isFlat = factors.some(f => f.includes("calmo"))
        const hasAdvancedFactor = factors.some(f =>
            f.includes("Oleaje fuerte") ||
            f.includes("Swell potente") ||
            f.includes("Swell energético") ||
            f.includes("Olitas en orilla") ||
            f.includes("Corriente lateral")
        )

        // ── PELIGROSOS — siempre primero, sin excepción ────────────────────────
        if (hasRipCurrent) return {
            label: "Peligroso",
            description: "Corriente que arrastra hacia el mar — no entrar",
        }
        if (hasOffshoreWind) return {
            label: "Peligroso",
            description: "Viento te empuja mar adentro — no entrar",
        }
        if (score <= 2 && hasHighWaves) return {
            label: "Peligroso",
            description: "Oleaje demasiado alto para nadar",
        }
        // dangerLevel HIGH siempre es peligroso
        if (dangerLevel === "HIGH") return {
            label: "Peligroso",
            description: "Condiciones peligrosas — no entrar",
        }

        // ── SOLO AVANZADOS — recién acá, después de descartar peligros ─────────
        if (dangerLevel === "ADVANCED") return {
            label: "Solo avanzados",
            description: "Viento fuerte — no recomendado para principiantes",
        }
        if (score <= 4 && hasAdvancedFactor && hasLateralCurrent) return {
            label: "Solo avanzados",
            description: "Corriente lateral con oleaje — exige experiencia",
        }
        if (score <= 4 && hasAdvancedFactor) return {
            label: "Solo avanzados",
            description: "Condiciones exigentes — no apto para principiantes",
        }

        // ── MALO ───────────────────────────────────────────────────────────────
        if (score <= 2) return {
            label: "Malo",
            description: "No se dan las condiciones",
        }

        // ── SCORE 3–4 ──────────────────────────────────────────────────────────
        if (score <= 4 && hasRoughSea) return {
            label: "Agitado",
            description: "Mar movido — con precaución",
        }
        if (score <= 4) return {
            label: "Flojo",
            description: "Se puede, pero no es ideal",
        }

        // ── SCORE 5–6 ──────────────────────────────────────────────────────────
        if (score <= 6 && isFlat) return {
            label: "Tranquilo",
            description: "Mar calmo — ideal para nadar",
        }
        if (score <= 6) return {
            label: "Bien",
            description: "Buenas condiciones",
        }

        // ── SCORE 7–8 ──────────────────────────────────────────────────────────
        if (score <= 8) return {
            label: "Muy bueno",
            description: "Agua en buenas condiciones",
        }

        // ── SCORE 9–10 ─────────────────────────────────────────────────────────
        return {
            label: "Excelente",
            description: "Día ideal para nadar",
        }
    }

    const getLabelSurf = (score: number, factors: string[]): { label: string; description: string } => {

        // Casos especiales — condiciones contradictorias
        const hasWaves = factors.some(f =>
            f.includes("Olas") ||
            f.includes("potente") ||
            f.includes("grande") ||
            f.includes("sólido") ||
            f.includes("consistente")
        );

        // FIX: alineados con los factores reales que emite getSurfRating
        const isDestroyed = factors.some(f =>
            f.includes("destruido") ||      // "Mar destruido por viento"
            f.includes("confuso") ||        // "Mar confuso"
            f.includes("desordenada")       // "Ola desordenada por viento"
        );

        const periodBad = factors.some(f =>
            f.includes("no es surfeable") ||
            f.includes("cierra rápido") ||
            f.includes("Swell débil")
        );

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
        if (score <= 1) return { label: "Plano", description: "Sin condiciones" };
        if (score <= 2) return { label: "Malo", description: "No vale la pena" };
        if (score <= 4) return { label: "Flojo", description: "Se puede, pero no destaca" };
        if (score <= 6) return { label: "Bien", description: "Condiciones bastante decentes" };
        if (score <= 8) return { label: "Muy bueno", description: "Agarra el traje" };

        return { label: "Excelente", description: "Día ideal" };
    };
    const getSupRating = (stats: any, spot: SpotLocation): RatingResult => {

        const {
            windSpeed,
            windDirection,
            windGusts,
            waveHeight,
            swellHeight,
            swellDirection,
            wavePeriod,
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
        } = stats;

        const factors: string[] = [];

        /* OLA DE REFERENCIA — para SUP las olas son inestabilidad, no el objetivo */
        let waveRef = waveHeight ?? swellHeight ?? 0;
        if (!spot.exposed) waveRef *= SUP_CONFIG.exposureReduction;

        /* VIENTO EFECTIVO (reparo del spot) */
        const { effectiveWind, sheltered } = applyShelter(
            windSpeed, windDirection, spot.windShelter, SUP_CONFIG.shelterReduction
        );
        if (sheltered) factors.push("Spot protegido del viento");

        const { isOffshore, isCross } = classifyWind(windDirection, spot.orientation ?? 90);

        /* ── HARD STOPS (antes de cualquier cálculo) ────────────────────────── */
        const hs = SUP_CONFIG.hardStop;

        if (windSpeed == null) {
            return { score: 0, factors: ["Sin datos de viento"], dangerLevel: "HIGH", isGlassy: false };
        }
        if (windSpeed > hs.extreme) {
            return { score: 0, factors: ["Viento extremo"], dangerLevel: "HIGH", isGlassy: false };
        }
        if (windSpeed >= hs.danger) {
            return { score: 0, factors: ["Peligro: viento muy fuerte"], dangerLevel: "HIGH", isGlassy: false };
        }
        if (windSpeed >= hs.strong) {
            return { score: 1, factors: ["Viento fuerte"], dangerLevel: "MEDIUM", isGlassy: false };
        }
        if (isOffshore && windSpeed >= hs.offshoreDanger) {
            return { score: 0, factors: ["Peligro: viento te lleva mar adentro"], dangerLevel: "HIGH", isGlassy: false };
        }
        if (windGusts != null && windGusts >= SUP_CONFIG.gusts.hardStop) {
            return { score: 0, factors: ["Peligro: ráfagas muy fuertes"], dangerLevel: "HIGH", isGlassy: false };
        }

        const gustyWind = hasStrongGusts(windSpeed, windGusts, SUP_CONFIG.gusts);

        /* GLASSY */
        const isGlassy = !gustyWind && effectiveWind < SUP_CONFIG.glassy.maxWind && waveRef < SUP_CONFIG.glassy.maxWave;
        if (isGlassy) {
            return { score: 10, factors: ["Espejo"], dangerLevel: "NONE", isGlassy: true };
        }

        /* ── PUNTAJE ADITIVO (raw 0..maxRaw) ─────────────────────────────────
           Convertido del modelo multiplicativo previo (windScore × dirección ×
           penalizaciones). El viento aporta la base y el resto son restas.
           Los números pueden diferir ±1 respecto del modelo anterior. */
        let score = 0;

        /* VIENTO — base del puntaje */
        score +=
            effectiveWind < 8 ? 10 :
                effectiveWind < 14 ? 9 :
                    effectiveWind < 20 ? 7 :
                        effectiveWind < 30 ? 5 :
                            effectiveWind < 40 ? 3 : 1;

        if (effectiveWind < 18) factors.push("Viento calmo");
        else if (effectiveWind < 28) factors.push("Viento moderado");
        else factors.push("Viento fuerte");

        /* RÁFAGAS — castigo aunque el viento medio sea bajo */
        if (gustyWind) {
            const g = SUP_CONFIG.gusts;
            score -= windGusts >= g.strong ? g.strongPenalty : g.penalty;
            factors.push(windGusts >= g.strong ? "Ráfagas fuertes" : "Viento arrachado");
            if (isOffshore) {
                score -= g.offshorePenalty;
                factors.push("Ráfagas hacia el mar");
            }
        }

        /* DIRECCIÓN DEL VIENTO — penalización
           onshore: sin penalización · cross: leve · offshore: te aleja de la costa */
        if (isCross) {
            score -= effectiveWind < 20 ? 1 : 2;
            factors.push("Viento lateral");
        } else if (isOffshore) {
            score -= effectiveWind < 15 ? 2 : 3;
            if (effectiveWind > 20) factors.push("Viento en direccion al mar");       // 20–28: advertencia
            else if (effectiveWind > 15) factors.push("Viento en direccion al mar leve"); // 15–20: informativo
        }

        /* VENTANA DE SWELL */
        if (swellDirection && spot.swellWindow) {
            const goodSwell = inAngleWindow(swellDirection, spot.swellWindow.min, spot.swellWindow.max);
            if (!goodSwell) {
                score -= 1;
                factors.push("Swell desfavorable");
            } else {
                factors.push("Swell favorable");
            }
        }

        /* TAMAÑO DE OLA — inestabilidad para SUP de tierra */
        if (waveRef >= 1.5) {
            score -= 3;
            factors.push("Olas grandes — muy inestable");
        } else if (waveRef >= 0.9) {
            score -= 1;
            factors.push("Olas medianas — inestable");
        } else if (waveRef >= 0.4) {
            factors.push("Algo de movimiento");
        }

        /* CHOP */
        const windWaveP = wavePeriod ?? 99;
        if (waveRef > 0.6 && windWaveP < 4) {
            score -= 2;
            factors.push("Mar picado");
        } else if (waveRef > 0.4 && windWaveP < 5) {
            score -= 1;
            factors.push("Chop");
        }

        /* MAREA — informativa (no penaliza, igual que antes) */
        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spot.name,
            data?.hourly?.sea_level_height_msl ?? [],
            data?.hourly?.time ?? [],
            selectedHour ?? new Date()
        );
        if (tide.phase === "mid") factors.push("Marea media");

        return {
            score: normalize(score, SUP_CONFIG.maxRaw),
            factors: dedupe(factors),
            isGlassy,
        };
    };
    const getSwimmingRating = (stats: any, spot: SpotLocation): RatingResult => {

        const {
            windSpeed,
            windDirection,
            windGusts,
            waveHeight,
            swellHeight,
            swellDirection,
            wavePeriod,
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious
        } = stats

        let score = SWIM_CONFIG.base
        const factors: string[] = []

        /* OLA TOTAL */
        let totalWave = waveHeight ?? swellHeight ?? 0
        if (!spot.exposed) totalWave *= SWIM_CONFIG.exposureReduction

        /* ENERGÍA DE SWELL */
        const swellEnergy =
            swellHeight != null && wavePeriod != null
                ? (swellHeight ** 2) * wavePeriod
                : 0

        /* VIENTO EFECTIVO (reparo del spot) */
        const { effectiveWind, sheltered } = applyShelter(
            windSpeed, windDirection, spot.windShelter, SWIM_CONFIG.shelterReduction
        )
        if (sheltered) factors.push("Viento protegido")

        /* DIRECCIONES */
        const { isOnshore, isOffshore, isCross, isSideShore } = classifyWind(windDirection, spot.orientation ?? 90);

        const swellDiff = swellDirection != null
            ? angleDiff(swellDirection, spot.orientation ?? 90)
            : null

        /* HARD STOPS */
        const hs = SWIM_CONFIG.hardStop
        if (windSpeed == null) {
            return { score: 0, factors: ["Sin datos de viento"], dangerLevel: "HIGH", isGlassy: false }
        }
        if (windSpeed > hs.orange) {
            return { score: 0, factors: ["Alerta Naranja"], dangerLevel: "HIGH", isGlassy: false }
        }
        if (windSpeed > hs.extreme) {
            return { score: 0, factors: ["Viento extremo"], dangerLevel: "HIGH", isGlassy: false }
        }
        if (windSpeed >= hs.veryStrong) {
            return { score: 0, factors: ["Viento muy fuerte"], dangerLevel: "HIGH", isGlassy: false }
        }
        if (isOffshore && windSpeed >= hs.offshoreDanger) {
            return { score: 0, factors: ["Viento en direccion al mar"], dangerLevel: "HIGH", isGlassy: false }
        }
        if (windSpeed >= hs.advanced) {
            // ← no es HIGH, no es peligro inmediato, pero no es para cualquiera
            return { score: 1, factors: ["Viento fuerte"], dangerLevel: "ADVANCED", isGlassy: false }
        }

        /* RÁFAGAS */
        if (hasStrongGusts(windSpeed, windGusts, SWIM_CONFIG.gusts)) {
            score -= SWIM_CONFIG.gusts.penalty
            factors.push("Ráfagas fuertes")
        }

        /* SWELL WINDOW */
        if (swellDirection != null && spot.swellWindow) {
            const goodSwell = inAngleWindow(swellDirection, spot.swellWindow.min, spot.swellWindow.max)
            if (!goodSwell) {
                totalWave *= 0.7
                factors.push("Swell bloqueado")
            }
        }

        /* OLEAJE */
        if (totalWave < 0.25) {
            score += 2
            factors.push("Mar calmo")
        } else if (totalWave < 0.5) {
            score += 1
        } else if (totalWave < 0.7) {
            score += 0
        } else if (totalWave < 1.0) {
            score -= 1
            factors.push("Oleaje moderado")
        } else if (totalWave < 1.3) {
            score -= 2
            factors.push("Oleaje fuerte")
        } else {
            score -= 3
            factors.push("Oleaje muy fuerte")
        }

        /* PERIODO */
        if (wavePeriod != null) {
            if (wavePeriod > 11 && totalWave > 0.8) {
                score -= 1
                factors.push("Swell potente")
            }
            if (wavePeriod < 5 && effectiveWind > 20) {
                score -= 1
                factors.push("Mar revuelto")
            }
        }

        /* VIENTO */
        if (effectiveWind < 10) {
            score += 2
        } else if (effectiveWind < 18) {
            score += 1
        } else if (effectiveWind > 30 && isOnshore) {
            score -= 2
            factors.push("Viento de frente")
        } else if (effectiveWind > 35) {
            if (isOffshore) {
                factors.push("Viento en direccion al mar")
            }
            score -= 1
            factors.push("Viento fuerte")
        }



        /* MAR PICADO */
        if (totalWave < 0.6 && effectiveWind > 35) {
            score -= 2
            factors.push("Mar picado")
        }

        /* MAREA */
        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spot.name,
            data?.hourly?.sea_level_height_msl ?? [],
            data?.hourly?.time ?? [],
            selectedHour ?? new Date()
        )
        if (tide.phase === "mid") {
            score += 1
            factors.push("Marea media")
        }
        if (tide.phase === "low") {
            factors.push("Marea baja")
        }

        /* RIP CURRENT */
        const tidalDrop = !tide.isRising && tide.phase !== "high"
        const swellCross = swellDiff != null && swellDiff > 20 && swellDiff < 110
        if (swellCross && totalWave > 0.9 && tidalDrop) {
            score -= 2
            factors.push("Corriente de resaca")
        }
        if (isSideShore && effectiveWind > 30) {
            score -= 1
            factors.push("Corriente lateral")
        }

        /* SHOREBREAK */
        if (totalWave > 1 && wavePeriod != null && wavePeriod < 7) {
            score -= 1
            factors.push("Olitas en orilla")
        }

        if (swellEnergy > 20 && totalWave > 0.8) {
            score -= 1
            factors.push("Swell energético")
        }

        const finalScore = clampScore(score)

        return {
            score: finalScore,
            factors: dedupe(factors),
            dangerLevel: dangerFromScore(finalScore),
            isGlassy: effectiveWind < SWIM_CONFIG.glassyMaxWind,
        }
    }
    const getSurfRating = (
        stats: any,

        spotName: string,
        spot: SpotLocation
    ): RatingResult => {
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

        let score = 0;
        let factors: string[] = [];

        if (windDirection == null || swellDirection == null) {
            return { score: 0, factors: ["Datos incompletos"] };
        }

        /* ── LÓGICA DEL SPOT ───────────────────────── */

        let swellAllowed = true;

        if (spot.swellWindow) {
            swellAllowed = inAngleWindow(
                swellDirection,
                spot.swellWindow.min,
                spot.swellWindow.max
            );
        }

        if (!swellAllowed) {
            return { score: 1, factors: ["Swell bloqueado por el golfo"] };
        }

        /* ── AJUSTE POR EXPOSICIÓN Y REPARO ─────────── */
        let adjustedSwell = swellHeight;
        if (!spot.exposed) adjustedSwell *= SURF_CONFIG.exposureReduction;

        const { effectiveWind } = applyShelter(
            windSpeed, windDirection, spot.windShelter, SURF_CONFIG.shelterReduction
        );

        /* ── ÁNGULOS ─────────────────────────────── */
        const { isOnshore, isOffshore } = classifyWind(windDirection, spot.orientation ?? 90);

        const swellDiff = swellDirection != null
            ? angleDiff(swellDirection, spot.orientation ?? 90)
            : null

        const period = swellPeriod ?? wavePeriod ?? null;

        /* ── HARD STOPS ──────────────────────────── */

        // CAMBIO: agregados hard stops de viento que no existían.
        // En Comodoro el viento puede ser extremo — offshore fuerte es peligroso
        // incluso para surf (te deja varado mar adentro si caés de la tabla)
        if (isOffshore && effectiveWind > SURF_CONFIG.wind.offshoreDanger) {
            return { score: 0, factors: ["Viento hacia el mar — peligroso"], isEpic: false };
        }

        if (effectiveWind > SURF_CONFIG.wind.extreme) {
            return { score: 0, factors: ["Viento extremo"], isEpic: false };
        }

        /* ── GATE DE SWELL ───────────────────────── */

        // CAMBIO: bajado de 0.6 a 0.3 — en el golfo 0.4m ya es surfeable
        // y el gate anterior descartaba demasiados días
        if (adjustedSwell < SURF_CONFIG.swellGate) {
            return { score: 1, factors: ["Olas demasiado pequeñas"] };
        }

        /* ── ENERGÍA DEL SWELL ───────────────────── */

        // CAMBIO: umbrales recalibrados para el golfo.
        // Con swells de 0.6–1.2m y periodos 6–10s, energy típica es 4–10.
        // Los tramos >= 13 y >= 18 de la versión original eran inalcanzables.
        if (period != null) {
            const energy = adjustedSwell * period;
            if (period >= 7 && period <= 9) {
                score += 2;
                factors.push("Período óptimo");
            } else if (period >= 6) {
                score += 1;
            } if (period < 5) {
                score -= 3;
                factors.push("Período muy corto");
            }
            if (energy >= 10) {
                score += 5;
                factors.push("Swell potente");
            } else if (energy >= 7) {
                score += 4;
                factors.push("Swell sólido");
            } else if (energy >= 5) {
                score += 3;
                factors.push("Swell consistente");
            } else if (energy >= 3) {
                score += 2;
                factors.push("Swell moderado");
            } else {
                score += 1;
                factors.push("Swell débil");
            }

        }

        /* ── ALTURA DEL SWELL ───────────────────── */

        // CAMBIO: techo bajado de 2.8m a 1.5m — el techo real en la zona.
        // En la versión original el score += 4 por altura era prácticamente inalcanzable.
        if (adjustedSwell >= 1.5) {
            score += 4;
            factors.push("Olas grandes");
        } else if (adjustedSwell >= 1.0) {
            score += 3;
            factors.push("Olas sólidas");
        } else if (adjustedSwell >= 0.7) {
            score += 2;
            factors.push("Olas decentes");
        } else if (adjustedSwell >= 0.4) {
            score += 1;
            factors.push("Olas chicas");
        }
        // < 0.3 ya fue atrapado por el gate arriba

        /* ── VIENTO ─────────────────────────────── */

        if (isOffshore) {

            // CAMBIO: techo offshore bajado de 55 a 35 antes de penalizar.
            // En la versión original, 55 km/h offshore sumaba +1 — inaceptable.
            if (effectiveWind <= 15) {
                score += 4;
                factors.push("Offshore limpio");
            } else if (effectiveWind <= 28) {
                score += 2;
                factors.push("Offshore moderado");
            } else if (effectiveWind <= 45) {
                score -= 1;
                factors.push("Offshore fuerte");
            } else {
                // > 45 offshore → peligroso pero no hard stop (hard stop es > 55)
                score -= 3;
                factors.push("Viento hacia el mar");
            }

        } else if (isOnshore) {

            // sin cambios en la lógica, solo ajustados umbrales levemente
            if (effectiveWind <= 12) {
                score += 1;
                factors.push("Onshore leve");
            } else if (effectiveWind <= 24) {
                score -= 1;
                factors.push("Onshore moderado");
            } else if (effectiveWind <= 35) {
                score -= 3;
                factors.push("Ola desordenada");
            } else {
                score -= 5;
                factors.push("Mar destruido");
            }

        } else {

            // viento lateral — sin cambios
            if (effectiveWind <= 18) {
                score += 1;
                factors.push("Viento lateral leve");
            } else if (effectiveWind <= 30) {
                score -= 1;
                factors.push("Viento lateral");
            } else {
                score -= 3;
                factors.push("Viento lateral fuerte");
            }
        }

        /* ── ÁNGULO DEL SWELL ───────────────────── */
        // sin cambios
        if (swellDiff && swellDiff <= 45) {
            score += 1;
            factors.push(swellDiff <= 12 ? "Swell directo" : "Ángulo favorable");
        }

        /* ── CHOP ───────────────────────────────── */
        // sin cambios
        if (waveHeight != null && adjustedSwell > 0) {
            const ratio = waveHeight / adjustedSwell;
            if (ratio > 1.2) {
                score -= 2;
                factors.push("Mar confuso");
            } else if (ratio > 0.85) {
                score -= 1;
                factors.push("Algo de chop");
            }
        }

        /* ── MAREA ─────────────────────────────── */
        // sin cambios
        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spotName,
            data?.hourly?.sea_level_height_msl ?? [],
            data?.hourly?.time ?? [],
            selectedHour ?? new Date()
        );

        // Puntaje por cercanía a la marea preferida del spot (no genérico).
        const tideWindow = spot.optimalTide ?? SURF_CONFIG.defaultOptimalTide;
        const tideBonus = tideWindowScore(tide.normalized, tideWindow);
        score += tideBonus;

        if (tideBonus >= 2) factors.push("Marea ideal");
        else if (tideBonus <= -1) factors.push("Marea desfavorable");
        else if (tide.phase === "high") factors.push("Marea alta");
        else if (tide.phase === "low") factors.push("Marea baja");
        else factors.push("Marea media");

        // El bonus por dirección solo corresponde si la marea se está
        // acercando a la ventana ideal del spot (por abajo y subiendo, o por
        // arriba y bajando). Si ya está adentro o se está alejando, "subiendo"
        // no es necesariamente bueno — depende de la ventana de cada spot.
        const approachingTideWindow =
            (tide.normalized < tideWindow.min && tide.isRising) ||
            (tide.normalized > tideWindow.max && !tide.isRising);
        if (approachingTideWindow) {
            score += 1;
            factors.push(tide.isRising ? "Marea subiendo hacia la ventana ideal" : "Marea bajando hacia la ventana ideal");
        }

        /* ── NORMALIZACIÓN + TECHO POR TAMAÑO ─────
           El tamaño de la ola limita el score: por más limpio que esté el
           viento, una ola chica no es surfeable (ver SURF_CONFIG.sizeCap). */
        const normalized = normalize(score, SURF_CONFIG.maxRaw);
        const sizeCap = SURF_CONFIG.sizeCap.find(t => adjustedSwell >= t.min)?.cap ?? 10;
        const finalScore = Math.min(normalized, sizeCap);

        // Solo avisamos "ola chica" cuando el techo la recorta y realmente es chica,
        // no cuando se capea un día de 1m+.
        if (finalScore < normalized && adjustedSwell < 0.7) {
            factors.push("Ola chica");
        }

        return {
            score: finalScore,
            factors: dedupe(factors),
            isEpic: finalScore >= 9 && isOffshore,
        };
    };

    const getLabelSup = (score: number, factors: string[]): { label: string; description: string } => {

        const isOffshoreDANGER = factors.some(f => f.includes("lleva mar adentro"));
        const isDangerous = factors.some(f => f.includes("Peligro") || f.includes("extremo"));
        const isGlassy = factors.some(f => f.includes("Espejo"));
        const hasLandWindMod = factors.some(f => f === "Viento en direccion al mar");        // 20–28 km/h
        const hasLandWindLeve = factors.some(f => f === "Viento en direccion al mar leve");   // 15–20 km/h
        const hasStrongWind = factors.some(f => f.includes("Viento fuerte"));
        const hasBigWaves = factors.some(f => f.includes("muy inestable") || f.includes("Olas grandes"));
        const hasChop = factors.some(f => f.includes("Mar picado") || f.includes("Chop"));
        const hasInstability = factors.some(f => f.includes("inestable") || f.includes("movimiento"));

        // Hard stop offshore peligroso — label específico
        if (isOffshoreDANGER) {
            return {
                label: "Peligroso",
                description: "Viento te lleva mar adentro",
            };
        }

        if (isDangerous) {
            return {
                label: "Peligroso",
                description: "No salir al agua",
            };
        }

        if (isGlassy) {
            return {
                label: "Espejo",
                description: "Condiciones perfectas para remar",
            };
        }

        // Viento en direccion al mar moderado (20–28 km/h) + factor negativo adicional → bajar label
        if (hasLandWindMod && (hasChop || hasInstability || score <= 5)) {
            return {
                label: "Estar atento",
                description: "Viento en direccion al mar — puede alejarte de la costa",
            };
        }

        // Viento en direccion al mar moderado sin otros factores negativos → solo informar
        if (hasLandWindMod) {
            return {
                label: score >= 6 ? "Bien" : "Flojo",
                description: "Viento en direccion al mar — estar atento al alejarse",
            };
        }

        // Viento en direccion al mar leve (15–20 km/h) → label normal, descripción informativa
        if (hasLandWindLeve) {
            if (score >= 7) return { label: "Muy bueno", description: "Viento en direccion al mar leve — sin problema" };
            if (score >= 5) return { label: "Bien", description: "Viento en direccion al mar leve — tenerlo en cuenta" };
        }

        // Resto de casos
        if (score <= 3 && hasBigWaves) {
            return { label: "Exigente", description: "Olas grandes — muy inestable para SUP" };
        }

        if (score <= 3 && hasStrongWind) {
            return { label: "Ventoso", description: "Cuesta mantener el rumbo" };
        }

        if (score <= 2) {
            return { label: "Malo", description: "No se dan las condiciones" };
        }

        if (score <= 4 && hasStrongWind) {
            return { label: "Ventoso", description: "Difícil mantener el rumbo" };
        }

        if (score <= 4 && hasChop) {
            return { label: "Flojo", description: "Algo de movimiento en el agua" };
        }

        if (score <= 4) return { label: "Flojo", description: "Se puede, pero cuesta" };
        if (score <= 6) return { label: "Bien", description: "Buena sesión de remo" };
        if (score <= 8) return { label: "Muy bueno", description: "Agarra la tabla" };

        return { label: "Excelente", description: "Día ideal para remar" };
    };



    const getBestWindow = (data: any, activity: ActivityType, forecastData?: ForecastData) => {
        const nowIndex = data.hourly.time.findIndex((t: any) => new Date(t) >= new Date());
        const scores: { index: number; score: number }[] = [];
        // Recorremos solo las próximas 24 horas
        for (let i = nowIndex; i < nowIndex + 24 && i < data.hourly.time.length; i++) {
            // Solo horas de luz: de 6 a 20
            const hour = new Date(data.hourly.time[i]).getHours();
            if (hour < 6 || hour > 20) continue;
            // Marine y forecast no arrancan a la misma hora: buscamos el índice del forecast por tiempo
            const f = forecastData ? findHourIndex(forecastData.hourly.time as unknown as Date[], new Date(data.hourly.time[i])) : -1;
            const hourlyStats = {
                waveHeight: data.hourly.wave_height[i],
                waveDirection: data.hourly.wave_direction[i],
                swellHeight: data.hourly.swell_wave_height[i],
                swellDirection: data.hourly.swell_wave_direction[i],
                swellPeriod: data.hourly.swell_wave_period?.[i] ?? 0,
                wavePeriod: data.hourly.wind_wave_period?.[i] ?? 0,
                windSpeed: f >= 0 ? forecastData?.hourly?.wind_speed_10m?.[f] ?? 0 : 0,
                windDirection: f >= 0 ? forecastData?.hourly?.wind_direction_10m?.[f] : undefined,
                windGusts: f >= 0 ? forecastData?.hourly?.wind_gusts_10m?.[f] : undefined,
                seaLevelHeightMsl: data.hourly.sea_level_height_msl[i],
                seaLevelHeightMslPrevious: data.hourly.sea_level_height_msl[i - 1] ?? 0,
            };

            const { score } = activity === "surf" ? getSurfRating(hourlyStats, beachName, spot) :
                activity === "sup" ? getSupRating(hourlyStats, spot) :
                    getSwimmingRating(hourlyStats, spot);

            scores.push({ index: i, score });
        }

        let best = -1;
        let maxScore = 0;
        scores.forEach((s, k) => {
            if (s.score > maxScore) { maxScore = s.score; best = k; }
        });

        // Rango: horas contiguas a la mejor con un puntaje a lo sumo 1 punto menor
        // (sin saltar la noche, que no está en `scores`)
        const fits = (a: number, b: number) => scores[b].index === scores[a].index + 1 && scores[a].score >= maxScore - 1;
        let from = best, to = best;
        if (best >= 0) {
            while (from > 0 && fits(from - 1, from)) from--;
            while (to < scores.length - 1 && scores[to + 1].index === scores[to].index + 1 && scores[to + 1].score >= maxScore - 1) to++;
        }
        const bestHour = best >= 0 ? data.hourly.time[scores[best].index] : null;

        return {
            time: bestHour ? new Date(bestHour).toLocaleDateString('es-AR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }) : "N/A",
            date: bestHour ? new Date(bestHour) : null,
            start: best >= 0 ? new Date(data.hourly.time[scores[from].index]) : null,
            end: best >= 0 ? new Date(data.hourly.time[scores[to].index]) : null,
            score: maxScore
        };
    };
    return {

        activities: {
            surf: getRating(hourlyStats, "surf", beachOrientation, beachName, spot),
            sup: getRating(hourlyStats, "sup", beachOrientation, beachName, spot),
            swimming: getRating(hourlyStats, "swimming", beachOrientation, beachName, spot),
        },
        ...(data ? {
            bestWindows: {
                surf: getBestWindow(data, "surf", forecastData),
                sup: getBestWindow(data, "sup", forecastData),
                swimming: getBestWindow(data, "swimming", forecastData),
            }
        } : {}),
    }
}
