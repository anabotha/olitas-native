import React, { use } from 'react'
import { ActivityRating, ActivityType, CombinedConditions, MarineWeatherData, ForecastData, activities, SpotLocation } from '@/lib/types'
import { getTidalPhase } from './use-processData';
function directionInWindow(dir: number, min: number, max: number) {

    if (min <= max) {
        return dir >= min && dir <= max
    }

    return dir >= min || dir <= max
}
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

        return {
            waveHeight: data.hourly.wave_height?.[idx] ?? null,
            waveDirection: data.hourly.wave_direction?.[idx] ?? null,
            swellHeight: data.hourly.swell_wave_height?.[idx] ?? null,
            swellDirection: data.hourly.swell_wave_direction?.[idx] ?? null,
            swellPeriod: data.hourly.swell_wave_period?.[idx] ?? null,
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
    const nowStats = processData?.current;


    const getRating = (
        stats: any,
        activity: ActivityType,
        beachOrientation: number,
        spotName: string,
        spot: SpotLocation
    ): ActivityRating => {
        console.log(nowStats)
        switch (activity) {
            case "surf": {
                const { score, factors } = getSurfRating(nowStats, beachOrientation, spotName, spot);
                return { ...getLabelSurf(score, factors), factors, score };
            }

            case "sup": {
                const { score, factors } = getSupRating(nowStats, spot);

                return { ...getLabelSup(score, factors), factors, score };
            }

            case "swimming": {
                const { score, factors } = getSwimmingRating(nowStats, spot);
                return { ...getLabelSwimming(score, factors), factors, score };
            }

        }
    };

    const angleDiff = (a: number, b: number) =>
        Math.abs((a - b + 540) % 360 - 180)



    const getLabelSwimming = (score: number, factors: string[]): { label: string; description: string } => {

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

    const getSurfRating = (
        stats: any,
        beachOrientation: number,
        spotName: string,
        spot: SpotLocation
    ) => {
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

        /* ── LÓGICA DEL SPOT ───────────────────────── */

        let swellAllowed = true;
        let isSheltered = false;

        if (spot.swellWindow) {
            swellAllowed = directionInWindow(
                swellDirection,
                spot.swellWindow.min,
                spot.swellWindow.max
            );
        }

        if (!swellAllowed) {
            return {
                score: 1,
                factors: ["Swell bloqueado por el golfo"],
            };
        }

        if (spot.windShelter) {
            isSheltered = directionInWindow(
                windDirection,
                spot.windShelter.min,
                spot.windShelter.max
            );
        }

        /* ── AJUSTE POR EXPOSICIÓN DEL SPOT ───────── */

        // FIX: reducido de 0.7 a 0.85 — el recorte anterior era demasiado agresivo
        // y tiraba el swell ajustado por debajo del gate de 0.6m en spots semi-protegidos
        let adjustedSwell = swellHeight;

        if (!spot.exposed) {
            adjustedSwell *= 0.85;
        }

        let effectiveWind = windSpeed;

        if (isSheltered) {
            effectiveWind *= 0.6;
        }

        /* ── ÁNGULOS ─────────────────────────────── */

        const windDiff = Math.abs((windDirection - beachOrientation + 540) % 360 - 180);
        const swellDiff = Math.abs((swellDirection - beachOrientation + 540) % 360 - 180);

        const isOffshore = windDiff > 135;
        const isOnshore = windDiff < 45;

        const period = swellPeriod ?? wavePeriod ?? null;

        /* ── GATES ───────────────────────────────── */

        if (adjustedSwell < 0.6) {
            return { score: 1, factors: ["Olas demasiado pequeñas"] };
        }

        /* ── ENERGÍA DEL SWELL ───────────────────── */

        if (period != null) {
            const energy = adjustedSwell * period;

            if (energy >= 18) {
                score += 5;
                factors.push("Swell potente");
            } else if (energy >= 13) {
                score += 4;
                factors.push("Swell sólido");
            } else if (energy >= 9) {
                score += 3;
                factors.push("Swell consistente");
            } else if (energy >= 6) {
                score += 2;
                factors.push("Swell moderado");
            } else {
                score += 1;
                factors.push("Swell débil");
            }
        }

        /* ── ALTURA DEL SWELL ───────────────────── */

        if (adjustedSwell >= 2.8) {
            score += 4;
            factors.push("Olas grandes");
        } else if (adjustedSwell >= 1.8) {
            score += 3;
            factors.push("Olas sólidas");
        } else if (adjustedSwell >= 1.2) {
            score += 2;
            factors.push("Olas decentes");
        } else if (adjustedSwell >= 0.9) {
            score += 1;
            factors.push("Olas chicas pero surfeables");
        }

        /* ── VIENTO ─────────────────────────────── */

        if (isOffshore) {

            if (effectiveWind <= 20) {
                score += 4;
                factors.push("Offshore limpio");
            } else if (effectiveWind <= 35) {
                score += 3;
                factors.push("Offshore moderado");
            } else if (effectiveWind <= 55) {
                score += 1;
                factors.push("Offshore fuerte");
            } else {
                score -= 2;
                factors.push("Offshore extremo");
            }

            // Nota: viento de tierra fuerte puede levantar spray excesivo
            if (effectiveWind > 24) {
                factors.push("Viento de tierra");
            }

        } else if (isOnshore) {

            // FIX: eliminada la condición imposible `if (isOffshore && ...)` que
            // estaba dentro de este bloque, rompiendo el encadenamiento de else-if
            if (effectiveWind <= 12) {
                score += 1;
                factors.push("Onshore leve");
            } else if (effectiveWind <= 24) {
                score -= 1;
                factors.push("Onshore moderado");
            } else if (effectiveWind <= 35) {
                score -= 3;
                factors.push("Ola desordenada por viento");
            } else {
                score -= 4;
                factors.push("Mar destruido por viento");
            }

        } else {

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

        if (swellDiff <= 45) {
            score += 1;

            if (swellDiff <= 12) {
                factors.push("Swell directo");
            } else {
                factors.push("Ángulo favorable");
            }
        }

        /* ── CHOP ───────────────────────────────── */

        if (waveHeight != null && adjustedSwell > 0) {
            const ratio = waveHeight / adjustedSwell;

            if (ratio > 1.2) {
                score -= 2;
                factors.push("Mar confuso");
            } else if (ratio > 0.85) {
                score -= 1;
                factors.push("Algo de viento en el mar");
            }
        }

        /* ── MAREA ─────────────────────────────── */

        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spotName,
            data?.hourly?.sea_level_height_msl ?? []
        );

        if (tide.phase === "mid") {
            score += 2;
            factors.push("Marea media");
        } else if (tide.phase === "high") {
            score -= 1;
            factors.push("Marea alta");
        } else {
            score += 1;
            // factors.push("Marea baja");
        }

        if (tide.isRising) {
            score += 1;
            factors.push("Marea subiendo");
        }

        /* ── NORMALIZACIÓN ─────────────────────── */

        const finalScore = Math.round(
            Math.min(Math.max(0, (score / MAX_RAW) * 10), 10)
        );

        return {
            score: finalScore,
            factors: [...new Set(factors)],
            isEpic: finalScore >= 9 && isOffshore,
        };
    };


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
    const inAngleWindow = (angle: number, min: number, max: number) => {
        if (min <= max) return angle >= min && angle <= max
        return angle >= min || angle <= max
    }

    // const getSupRating = (stats: any, spot: SpotLocation) => {

    //     const {
    //         windSpeed,
    //         windDirection,
    //         waveHeight,
    //         swellHeight,
    //         swellDirection,
    //         wavePeriod,
    //         seaLevelHeightMsl,
    //         seaLevelHeightMslPrevious,
    //     } = stats
    //     const factors: string[] = []

    //     /* WAVE REFERENCE */

    //     let waveRef = waveHeight ?? swellHeight ?? 0

    //     if (!spot.exposed) {
    //         waveRef *= 0.6
    //     }

    //     /* WIND SHELTER */

    //     let effectiveWind = windSpeed

    //     if (spot.windShelter && inAngleWindow(windDirection, spot.windShelter.min, spot.windShelter.max)) {
    //         effectiveWind *= 0.65
    //         factors.push("Spot protegido del viento")
    //     }

    //     const diff = angleDiff(windDirection, spot.orientation ? spot.orientation : 90)

    //     const isOffshore = diff > 135
    //     const isOnshore = diff < 45
    //     const isCross = !isOnshore && !isOffshore

    //     /* HARD STOPS */

    //     if (isOffshore && effectiveWind > 22) {
    //         return { score: 0, factors: ["Peligro: viento de tierra fuerte"], dangerLevel: "HIGH", isGlassy: false }
    //     }

    //     if (effectiveWind > 55) {
    //         return { score: 0, factors: ["Viento extremo"], dangerLevel: "HIGH", isGlassy: false }
    //     }

    //     /* GLASSY */

    //     const isGlassy = effectiveWind < 12 && waveRef < 0.25

    //     if (isGlassy) {
    //         return { score: 10, factors: ["Espejo"], dangerLevel: "NONE", isGlassy: true }
    //     }

    //     /* WIND SCORE */

    //     let windScore =
    //         effectiveWind < 8 ? 10 :
    //             effectiveWind < 14 ? 9 :
    //                 effectiveWind < 20 ? 7 :
    //                     effectiveWind < 30 ? 5 :
    //                         effectiveWind < 40 ? 3 : 1

    //     if (effectiveWind < 18) factors.push("Viento calmo")
    //     else if (effectiveWind < 28) factors.push("Viento moderado")
    //     else factors.push("Viento fuerte")

    //     /* DIRECTION QUALITY */

    //     let directionMultiplier =
    //         isOnshore ? 1 :
    //             isCross ? (effectiveWind < 20 ? 0.9 : 0.7) :
    //                 (effectiveWind < 15 ? 0.8 : 0.4)

    //     if (isCross) factors.push("Viento lateral")
    //     if (isOffshore) factors.push("Viento de tierra")

    //     let baseScore = windScore * directionMultiplier

    //     /* SWELL WINDOW */

    //     if (swellDirection && spot.swellWindow) {

    //         const goodSwell = inAngleWindow(
    //             swellDirection,
    //             spot.swellWindow.min,
    //             spot.swellWindow.max
    //         )

    //         if (!goodSwell) {
    //             baseScore *= 0.85
    //             factors.push("Swell desfavorable")
    //         } else {
    //             factors.push("Swell favorable")
    //         }
    //     }

    //     /* WAVE SIZE */
    //     let wavePenalty =
    //         waveRef < 0.4 ? 1 :
    //             waveRef < 0.9 ? 0.95 :
    //                 waveRef < 1.4 ? 0.85 :
    //                     waveRef < 2 ? 0.65 : 0.4

    //     if (waveRef >= 1 && waveRef < 1.5) factors.push("Olas medianas")
    //     if (waveRef >= 1.5) factors.push("Olas grandes")

    //     /* CHOP */

    //     const windWaveP = wavePeriod ?? 99

    //     let chopPenalty =
    //         (waveRef > 0.6 && windWaveP < 4) ? 0.75 :
    //             (waveRef > 0.4 && windWaveP < 5) ? 0.85 :
    //                 1

    //     if (chopPenalty === 0.6) factors.push("Mar picado")
    //     if (chopPenalty === 0.8) factors.push("Chop")

    //     /* TIDE */

    //     const tide = getTidalPhase(
    //         seaLevelHeightMsl,
    //         seaLevelHeightMslPrevious,
    //         spot.name,
    //         data?.hourly?.sea_level_height_msl ?? []
    //     )

    //     let tidePenalty = 1

    //     if (tide.phase === "mid") factors.push("Marea media")

    //     if (tide.phase === "low") {
    //         tidePenalty = 0.85
    //         factors.push("Marea baja")
    //     }

    //     /* FINAL SCORE */

    //     let finalScore =
    //         baseScore *
    //         wavePenalty *
    //         chopPenalty *
    //         tidePenalty

    //     finalScore = Math.round(Math.max(0, Math.min(finalScore, 10)))

    //     return {
    //         score: finalScore,
    //         factors: [...new Set(factors)],
    //         isGlassy
    //     }
    // }
    // const getLabelSup = (score: number, factors: string[]): { label: string; description: string } => {

    //     const isDangerous = factors.some(f => f.includes("Peligro") || f.includes("extremo"));
    //     const isGlassy = factors.some(f => f.includes("Espejo"));
    //     const hasStrongWind = factors.some(f => f.includes("Viento fuerte") || f.includes("Ráfagas muy fuertes"));
    //     const hasLandWind = factors.some(f => f.includes("Viento de tierra"));
    //     const hasBigWaves = factors.some(f => f.includes("Olas grandes") || f.includes("Olas muy grandes"));

    //     if (isDangerous) return {
    //         label: "Peligroso",
    //         description: "No salir al agua",
    //     };

    //     if (isGlassy) return {
    //         label: "Espejo",
    //         description: "Condiciones perfectas para remar",
    //     };
    //     if (score <= 2 && hasLandWind && hasStrongWind) return {
    //         label: "Peligroso",
    //         description: "Viento de tierra — te aleja de la costa",
    //     };
    //     if (score <= 2 && hasLandWind && !hasStrongWind) {
    //         return {
    //             label: "Estar atento",
    //             description: "Viento de tierra — puede alejarte de la costa",
    //         };
    //     }
    //     if (score <= 3 && hasStrongWind) {
    //         return {
    //             label: "Ventoso",
    //             description: "Cuesta mantener el rumbo",
    //         };
    //     }
    //     if (score <= 3 && hasBigWaves) return {
    //         label: "Exigente",
    //         description: "Olas grandes — solo para expertos",
    //     };

    //     if (score <= 2) return {
    //         label: "Malo",
    //         description: "No se dan las condiciones",
    //     };

    //     if (score <= 4 && hasStrongWind) return {
    //         label: "Ventoso",
    //         description: "Difícil mantener el rumbo",
    //     };

    //     if (score <= 4) return {
    //         label: "Flojo",
    //         description: "Se puede, pero cuesta",
    //     };

    //     if (score <= 6) return {
    //         label: "Bien",
    //         description: "Buena sesión de remo",
    //     };

    //     if (score <= 8) return {
    //         label: "Muy bueno",
    //         description: "Agarra la tabla",
    //     };

    //     return {
    //         label: "Excelente",
    //         description: "Día ideal para remar",
    //     };
    // };
    const getSupRating = (stats: any, spot: SpotLocation) => {

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

        const factors: string[] = [];

        /* WAVE REFERENCE */

        let waveRef = waveHeight ?? swellHeight ?? 0;

        // SUP de tierra — las olas son inestabilidad, no el objetivo
        if (!spot.exposed) {
            waveRef *= 0.6;
        }

        /* WIND SHELTER
           El reparo reduce effectiveWind antes de aplicar cualquier lógica.
           Toda la escala Beaufort se evalúa sobre effectiveWind, no sobre windSpeed crudo. */

        let effectiveWind = windSpeed;

        if (spot.windShelter && inAngleWindow(windDirection, spot.windShelter.min, spot.windShelter.max)) {
            effectiveWind *= 0.65;
            factors.push("Spot protegido del viento");
        }

        const diff = angleDiff(windDirection, spot.orientation ? spot.orientation : 90);

        const isOffshore = diff > 135;
        const isOnshore = diff < 45;
        const isCross = !isOnshore && !isOffshore;

        /* HARD STOPS
           Beaufort 5 offshore (≥28 km/h efectivos) → peligroso, te lleva mar adentro.
           Subido desde 22 km/h: con reparo activo un viento real de ~43 km/h
           queda en ~28, que es el límite real Beaufort 4→5. */

        // ── HARD STOPS (antes de cualquier cálculo) ──────────────────────────

        if (isOffshore && windSpeed >= 34) {
            return {
                score: 0,
                factors: ["Peligro: viento te lleva mar adentro"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        if (windSpeed > 55) {
            return {
                score: 0,
                factors: ["Viento extremo"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        // Viento muy fuerte → peligro
        if (windSpeed >= 45) {
            return {
                score: 0,
                factors: ["Peligro: viento muy fuerte"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        // Viento fuerte → penalización fuerte (no hard stop)
        if (windSpeed >= 35) {
            return {
                score: 1,
                factors: ["Viento fuerte"],
                dangerLevel: "MEDIUM",
                isGlassy: false,
            };
        }

        /* GLASSY */

        const isGlassy = effectiveWind < 12 && waveRef < 0.25;

        if (isGlassy) {
            return { score: 10, factors: ["Espejo"], dangerLevel: "NONE", isGlassy: true };
        }

        /* WIND SCORE */

        let windScore =
            effectiveWind < 8 ? 10 :
                effectiveWind < 14 ? 9 :
                    effectiveWind < 20 ? 7 :
                        effectiveWind < 30 ? 5 :
                            effectiveWind < 40 ? 3 : 1;

        if (effectiveWind < 18) factors.push("Viento calmo");
        else if (effectiveWind < 28) factors.push("Viento moderado");
        else factors.push("Viento fuerte");

        /* DIRECTION QUALITY + FACTOR DE VIENTO DE TIERRA
           Beaufort aplicado sobre effectiveWind (ya con reparo):
           ≤15      → sin mención
           15–20    → "Viento de tierra leve"   (solo factor, no afecta label)
           20–28    → "Viento de tierra"         (factor + puede bajar label en getLabelSup)
           ≥28      → hard stop arriba (nunca llega acá) */

        let directionMultiplier =
            isOnshore ? 1 :
                isCross ? (effectiveWind < 20 ? 0.9 : 0.7) :
                    (effectiveWind < 15 ? 0.8 : 0.4);

        if (isCross) factors.push("Viento lateral");

        if (isOffshore) {
            if (effectiveWind > 20) {
                factors.push("Viento de tierra");        // 20–28: advertencia moderada
            } else if (effectiveWind > 15) {
                factors.push("Viento de tierra leve");   // 15–20: solo informativo
            }
            // ≤15: silencio total
        }

        let baseScore = windScore * directionMultiplier;

        /* SWELL WINDOW */

        if (swellDirection && spot.swellWindow) {
            const goodSwell = inAngleWindow(
                swellDirection,
                spot.swellWindow.min,
                spot.swellWindow.max
            );

            if (!goodSwell) {
                baseScore *= 0.85;
                factors.push("Swell desfavorable");
            } else {
                factors.push("Swell favorable");
            }
        }

        /* WAVE SIZE — inestabilidad para SUP de tierra */

        let wavePenalty =
            waveRef < 0.4 ? 1 :
                waveRef < 0.9 ? 0.95 :
                    waveRef < 1.4 ? 0.85 :
                        waveRef < 2 ? 0.65 : 0.4;

        if (waveRef >= 0.4 && waveRef < 0.9) factors.push("Algo de movimiento");
        if (waveRef >= 0.9 && waveRef < 1.5) factors.push("Olas medianas — inestable");
        if (waveRef >= 1.5) factors.push("Olas grandes — muy inestable");

        /* CHOP
           FIX: valores comparados alineados con los valores asignados reales. */

        const windWaveP = wavePeriod ?? 99;

        let chopPenalty: number;

        if (waveRef > 0.6 && windWaveP < 4) {
            chopPenalty = 0.75;
            factors.push("Mar picado");
        } else if (waveRef > 0.4 && windWaveP < 5) {
            chopPenalty = 0.85;
            factors.push("Chop");
        } else {
            chopPenalty = 1;
        }

        /* TIDE */

        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spot.name,
            data?.hourly?.sea_level_height_msl ?? []
        );

        let tidePenalty = 1;

        if (tide.phase === "mid") factors.push("Marea media");

        if (tide.phase === "low") {
            tidePenalty = 1;
            // factors.push("Marea baja");
        }

        /* FINAL SCORE */

        let finalScore =
            baseScore *
            wavePenalty *
            chopPenalty *
            tidePenalty;

        finalScore = Math.round(Math.max(0, Math.min(finalScore, 10)));

        return {
            score: finalScore,
            factors: [...new Set(factors)],
            isGlassy,
        };
    };


    const getLabelSup = (score: number, factors: string[]): { label: string; description: string } => {

        const isOffshoreDANGER = factors.some(f => f.includes("lleva mar adentro"));
        const isDangerous = factors.some(f => f.includes("Peligro") || f.includes("extremo"));
        const isGlassy = factors.some(f => f.includes("Espejo"));
        const hasLandWindMod = factors.some(f => f === "Viento de tierra");        // 20–28 km/h
        const hasLandWindLeve = factors.some(f => f === "Viento de tierra leve");   // 15–20 km/h
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

        // Viento de tierra moderado (20–28 km/h) + factor negativo adicional → bajar label
        if (hasLandWindMod && (hasChop || hasInstability || score <= 5)) {
            return {
                label: "Estar atento",
                description: "Viento de tierra — puede alejarte de la costa",
            };
        }

        // Viento de tierra moderado sin otros factores negativos → solo informar
        if (hasLandWindMod) {
            return {
                label: score >= 6 ? "Bien" : "Flojo",
                description: "Viento de tierra — estar atento al alejarse",
            };
        }

        // Viento de tierra leve (15–20 km/h) → label normal, descripción informativa
        if (hasLandWindLeve) {
            if (score >= 7) return { label: "Muy bueno", description: "Viento de tierra leve — sin problema" };
            if (score >= 5) return { label: "Bien", description: "Viento de tierra leve — tenerlo en cuenta" };
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
    const getSwimmingRating = (stats: any, spot: SpotLocation) => {

        const {
            windSpeed,
            windDirection,
            waveHeight,
            swellHeight,
            swellDirection,
            wavePeriod,
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious
        } = stats

        let score = 5
        const factors: string[] = []

        /* OLA TOTAL */

        let totalWave = waveHeight ?? swellHeight ?? 0

        if (!spot.exposed) {
            totalWave *= 0.6
        }

        /* ENERGÍA DE SWELL */

        const swellEnergy =
            swellHeight != null && wavePeriod != null
                ? (swellHeight ** 2) * wavePeriod
                : 0

        /* VIENTO EFECTIVO */

        let effectiveWind = windSpeed

        if (
            spot.windShelter &&
            inAngleWindow(windDirection, spot.windShelter.min, spot.windShelter.max)
        ) {
            effectiveWind *= 0.65
            factors.push("Playa protegida del viento")
        }

        /* DIRECCIONES */

        const windDiff = angleDiff(windDirection, spot.orientation ? spot.orientation : 90)

        const swellDiff =
            swellDirection != null
                ? angleDiff(swellDirection, spot.orientation ? spot.orientation : 90)
                : null

        const isOnshore = windDiff < 45
        const isOffshore = windDiff > 135
        const isCross = !isOnshore && !isOffshore
        // ── HARD STOPS (antes de cualquier cálculo) ──────────────────────────

        if (isOffshore && windSpeed >= 28) {
            return {
                score: 0,
                factors: ["Peligro: viento te lleva mar adentro"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        if (windSpeed > 55) {
            return {
                score: 0,
                factors: ["Viento extremo"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        // Viento muy fuerte → peligro
        if (windSpeed >= 45) {
            return {
                score: 0,
                factors: ["Peligro: viento muy fuerte"],
                dangerLevel: "HIGH",
                isGlassy: false,
            };
        }

        // Viento fuerte → penalización fuerte (no hard stop)
        if (windSpeed >= 35) {
            return {
                score: 1,
                factors: ["Viento fuerte"],
                dangerLevel: "MEDIUM",
                isGlassy: false,
            };
        }
        /* SWELL WINDOW */

        if (swellDirection != null && spot.swellWindow) {

            const goodSwell = inAngleWindow(
                swellDirection,
                spot.swellWindow.min,
                spot.swellWindow.max
            )

            if (!goodSwell) {
                totalWave *= 0.7
                factors.push("Swell bloqueado")
            }
        }

        /* OLEAJE */

        if (totalWave < 0.25) {
            score += 2
            factors.push("Mar planchado")
        }
        else if (totalWave < 0.5) {
            score += 1
        }
        else if (totalWave < 0.9) {
            score += 0
        }
        else if (totalWave < 1.3) {
            score -= 1
            factors.push("Oleaje moderado")
        }
        else {
            score -= 2
            factors.push("Oleaje fuerte")
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
        }
        else if (effectiveWind < 18) {
            score += 1
        }
        else if (effectiveWind > 30 && isOnshore) {
            score -= 2
            factors.push("Viento onshore fuerte")
        }
        else if (effectiveWind > 35) {
            score -= 1
            factors.push("Viento fuerte")
        }

        if (isOffshore && effectiveWind < 20) {
            score += 1
            factors.push("Viento de tierra")
        }

        /* MAR CORTO (típico Patagonia) */

        if (totalWave < 0.6 && effectiveWind > 35) {
            score -= 2
            factors.push("Mar corto con viento fuerte")
        }

        /* MAREA */

        const tide = getTidalPhase(
            seaLevelHeightMsl,
            seaLevelHeightMslPrevious,
            spot.name,
            data?.hourly?.sea_level_height_msl ?? []
        )

        if (tide.phase === "mid") {
            score += 1
            factors.push("Marea cómoda")
        }

        if (tide.phase === "low") {
            factors.push("Marea baja")
        }

        /* RIP CURRENT RISK */

        const tidalDrop =
            !tide.isRising && tide.phase !== "high"

        const swellCross =
            swellDiff != null && swellDiff > 20 && swellDiff < 110

        if (swellCross && totalWave > 0.9 && tidalDrop) {
            score -= 2
            factors.push("Riesgo de corriente de resaca")
        }

        if (isCross && effectiveWind > 30) {
            score -= 1
            factors.push("Corriente lateral")
        }

        /* SHOREBREAK */

        if (totalWave > 1 && wavePeriod != null && wavePeriod < 7) {
            score -= 1
            factors.push("Shorebreak")
        }

        /* ENERGÍA ALTA DE SWELL */

        if (swellEnergy > 20 && totalWave > 0.8) {
            score -= 1
            factors.push("Swell con mucha energía")
        }

        /* NORMALIZACIÓN */

        const finalScore = Math.round(
            Math.min(Math.max(0, score), 10)
        )

        return {
            score: finalScore,
            factors: [...new Set(factors)],

        }
    }
    const getBestWindow = (data: any, activity: ActivityType, beachOrientation?: number, forecastData?: ForecastData) => {
        const nowIndex = data.hourly.time.findIndex((t: any) => new Date(t) >= new Date());
        let bestHour = null;
        let maxScore = 0;
        // Recorremos solo las próximas 24 horas
        for (let i = nowIndex; i < nowIndex + 24 && i < data.hourly.time.length; i++) {
            const hourlyStats = {
                waveHeight: data.hourly.wave_height[i],
                waveDirection: data.hourly.wave_direction[i],
                swellHeight: data.hourly.swell_wave_height[i],
                swellDirection: data.hourly.swell_wave_direction[i],
                swellPeriod: data.hourly.swell_wave_period?.[i] ?? 0,
                wavePeriod: data.hourly.wind_wave_period?.[i] ?? 0,
                windSpeed: forecastData?.hourly?.wind_speed_10m?.[i] ?? 0,     // ✅
                windDirection: forecastData?.hourly?.wind_direction_10m?.[i],   // ✅
                seaLevelHeightMsl: data.hourly.sea_level_height_msl[i],
                seaLevelHeightMslPrevious: data.hourly.sea_level_height_msl[i - 1] ?? 0,
            };

            const { score } = activity === "surf" ? getSurfRating(hourlyStats, beachOrientation ? beachOrientation : 90, beachName, spot) :
                activity === "sup" ? getSupRating(hourlyStats, spot) :
                    getSwimmingRating(hourlyStats, spot);

            if (score > maxScore) {
                maxScore = score;
                bestHour = data.hourly.time[i];
            }
        }

        return {
            time: bestHour ? new Date(bestHour).toLocaleDateString('es-AR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }) : "N/A",
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
                surf: getBestWindow(data, "surf", beachOrientation ?? 90, forecastData),
                sup: getBestWindow(data, "sup", beachOrientation ?? 90, forecastData),
                swimming: getBestWindow(data, "swimming", beachOrientation ?? 90, forecastData),
            }
        } : {}),
    }
}
