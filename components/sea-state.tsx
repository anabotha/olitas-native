// import { Card } from "@hugeicons/core-free-icons";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { processData } from "@/hooks/use-processData";
import { useRatings } from "@/hooks/use-ratings";
import { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { KayakIcon, SwimmingIcon, SurfboardIcon } from "@hugeicons/core-free-icons";
import { ArrowDown, ArrowUp, Waves } from "lucide-react";
import { getScoreBg, getScoreSegmentColor, getScoreTextColor } from "./activity-card";
import { cn } from "@/lib/utils";
import { InfoTip } from "./info-tip";

// "Hoy 14:00" / "Mañana 7:00" / "Sáb 9:00"
const formatWindowTime = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);
    const hour = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    if (diffDays === 0) return `Hoy ${hour}`;
    if (diffDays === 1) return `Mañana ${hour}`;
    const weekday = date.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "");
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${hour}`;
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// "Hoy 14–17 h" / "Hoy 22:00 – Mañana 1:00" / "Hoy 14:00" si es una sola hora
const formatWindowRange = (start: Date, end: Date) => {
    if (start.getTime() === end.getTime()) return formatWindowTime(start);
    if (isSameDay(start, end)) {
        const day = formatWindowTime(start).split(" ")[0];
        return `${day} ${start.getHours()}–${end.getHours()} h`;
    }
    return `${formatWindowTime(start)} – ${formatWindowTime(end)}`;
};

// Solo se muestran ventanas con puntaje > 5
const getWindowLabel = (score: number) => {
    if (score <= 6) return "Bien";
    if (score <= 8) return "Muy bueno";
    return "Excelente";
};

// Chip suave por condición, reutilizando la escala de colores de las actividades
const getConditionChip = (condition: string) => {
    if (condition === "Planchado") return cn(getScoreBg(8), getScoreTextColor(8));
    if (condition === "Picado") return cn(getScoreBg(4), getScoreTextColor(4));
    return "bg-highlight text-primary";
};

// Primera hora desde `from` en la que el nivel del mar cambia de tendencia (pleamar o bajamar)
const getNextTideTurn = (data: MarineWeatherData, from: Date) => {
    const times = data.hourly.time;
    const levels = data.hourly.sea_level_height_msl;
    if (!levels) return null;
    const start = times.findIndex(t => new Date(t).getTime() >= from.getTime());
    if (start < 1) return null;
    for (let i = start; i < levels.length - 1; i++) {
        const prev = levels[i - 1], curr = levels[i], next = levels[i + 1];
        if (prev == null || curr == null || next == null) continue;
        if (curr >= prev && curr > next) return { type: "Pleamar", date: new Date(times[i]) };
        if (curr <= prev && curr < next) return { type: "Bajamar", date: new Date(times[i]) };
    }
    return null;
};

interface SeaStateProps {
    data: MarineWeatherData;
    forecast: ForecastData | undefined;
    beach: SpotLocation;
    selectedHour: Date | undefined;
}

export const SeaState = ({ data, forecast, beach, selectedHour }: SeaStateProps) => {
    const processedData = processData(data, forecast, beach.orientation, beach.name, selectedHour);
    if (!processedData) return null;

    const ratings = useRatings(processedData, beach.name, beach.orientation ?? 90, beach, data, forecast, selectedHour);
    const bestWindows = ratings.bestWindows;
    const { seaState } = processedData;
    if (!seaState || !bestWindows) return null;

    const nextTide = getNextTideTurn(data, selectedHour ?? new Date());
    const TideArrow = seaState.isRising ? ArrowUp : ArrowDown;

    // 1. IMPORTANTE: Guardamos la referencia del componente del icono, no el JSX
    const activities = [
        { label: "Surf", data: bestWindows.surf, icon: SurfboardIcon },
        { label: "SUP", data: bestWindows.sup, icon: KayakIcon },
        { label: "Natación", data: bestWindows.swimming, icon: SwimmingIcon },
    ];
    // 2. Filtramos ANTES de renderizar para evitar arrays con 'undefined'
    const validWindows = activities.filter(a => {
        if (!a.data.date) return false;
        const isFuture = a.data.date >= new Date();
        return a.data.score > 5 && isFuture;
    }).sort((a, b) => (a.data.start ?? a.data.date!).getTime() - (b.data.start ?? b.data.date!).getTime());
    return (
        <Card>
            {/* <CardHeader> 
                <CardTitle className="text-lg font-semibold">
                    Estado del Mar
                </CardTitle> 
            </CardHeader> */}

            <section className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="space-y-2 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Condición</p>
                    <p className={cn("inline-flex rounded-full px-3 py-1 text-base font-semibold", getConditionChip(seaState.condition))}>
                        {seaState.condition}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-3">Marea</p>
                    {/* <p className="text-xl font-semibold">{seaState.tideInfo === "low" ? "Baja" : ""}{seaState.tideInfo === "high" ? "Alta" : ""}{seaState.tideInfo === "mid" ? "Media" : ""}</p> */}
                    <p className="flex items-center gap-1.5 text-xl font-semibold">
                        <TideArrow className="h-5 w-5 text-primary" aria-hidden />
                        {seaState.isRising ? "Subiendo" : "Bajando"}
                    </p>
                    {nextTide && (
                        <p className="text-sm text-muted-foreground">
                            {nextTide.type} {formatWindowTime(nextTide.date).replace(/^Hoy /, "a las ").replace(/^Mañana/, "mañana")}
                        </p>
                    )}

                </div>

                <div className="p-5">
                    <div className="mb-3 flex items-center gap-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Posibles Ventanas
                        </p>
                        <InfoTip text="Los mejores horarios para hacer deporte dentro de las próximas horas." />
                    </div>

                    <div className="space-y-2">
                        {validWindows.length > 0 ? (
                            validWindows.map((activity, idx) => (
                                <div
                                    key={`${activity.label}-${activity.data.time}-${idx}`}
                                    className="flex items-center justify-between rounded-lg bg-highlight px-3 py-2"
                                >
                                    <span className="font-medium flex items-center gap-2">
                                        <HugeiconsIcon icon={activity.icon} size={20} className="text-primary" />
                                        {activity.label}
                                    </span>
                                    <span className="flex flex-col items-end gap-0.5">
                                        <span className="text-sm font-medium text-foreground">
                                            {activity.data.start && activity.data.end
                                                ? formatWindowRange(activity.data.start, activity.data.end)
                                                : activity.data.date && formatWindowTime(activity.data.date)}
                                        </span>
                                        <span className={cn("flex items-center gap-1.5 text-xs font-semibold", getScoreTextColor(activity.data.score))}>
                                            <span className={cn("h-2 w-2 rounded-full", getScoreSegmentColor(activity.data.score))} aria-hidden />
                                            {getWindowLabel(activity.data.score)}
                                        </span>
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-start gap-3 rounded-lg bg-highlight px-3 py-3">
                                <Waves className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                                <p className="text-sm text-foreground">
                                    Nada destacable en las próximas horas.
                                    <span className="block text-muted-foreground">Volvé a chequear más tarde.</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </Card>
    );
};