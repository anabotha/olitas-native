// import { Card } from "@hugeicons/core-free-icons";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { processData } from "@/hooks/use-processData";
import { useRatings } from "@/hooks/use-ratings";
import { ForecastData, MarineWeatherData, SpotLocation } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { KayakIcon, SwimmingIcon, SurfboardIcon } from "@hugeicons/core-free-icons";

interface SeaStateProps {
    data: MarineWeatherData;
    forecast: ForecastData | undefined;
    beach: SpotLocation;
}

export const SeaState = ({ data, forecast, beach }: SeaStateProps) => {
    const processedData = processData(data, forecast, beach.orientation, beach.name);
    if (!processedData) return null;

    const ratings = useRatings(processedData, beach.name, beach.orientation ?? 90, beach, data, forecast, new Date());
    const bestWindows = ratings.bestWindows;

    const { seaState } = processedData;
    if (!seaState || !bestWindows) return null;

    const now = new Date().getHours();

    // 1. IMPORTANTE: Guardamos la referencia del componente del icono, no el JSX
    const activities = [
        { label: "Surf ", data: bestWindows.surf, icon: SurfboardIcon },
        { label: "SUP", data: bestWindows.sup, icon: KayakIcon },
        { label: "SUP", data: bestWindows.sup, icon: KayakIcon },

        { label: "Natación", data: bestWindows.swimming, icon: SwimmingIcon },
    ];
    // 2. Filtramos ANTES de renderizar para evitar arrays con 'undefined'
    const validWindows = activities.filter(a => {
        // 1. Extraemos solo la hora (ej: "15:00" -> 15)
        const hour = Number(a.data.time.split(':')[0]);
        const now = new Date().getHours();

        // 2. Tu lógica de ventana horaria
        const isFuture = hour >= now || (now >= 22 && hour <= 5);

        // 3. Score > 5
        return a.data.score > 5 && isFuture;
    });

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    Estado del Mar
                </CardTitle>
            </CardHeader>

            <section className="grid md:grid-cols-2 gap-6 p-4">
                <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Condición</p>
                    <p className="text-xl font-semibold">{seaState.condition}</p>
                    <p className="text-sm uppercase tracking-wide text-secondary-foreground mt-4">Marea</p>
                    {/* <p className="text-xl font-semibold">{seaState.tideInfo === "low" ? "Baja" : ""}{seaState.tideInfo === "high" ? "Alta" : ""}{seaState.tideInfo === "mid" ? "Media" : ""}</p> */}
                    <p className="text-xl font-semibold">{seaState.isRising ? "Subiendo" : "Bajando"}</p>

                </div>

                <div className="bg-muted/40 rounded-xl p-4">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
                        Posibles Ventanas
                    </p>

                    <div className="space-y-2">
                        {validWindows.length > 0 ? (
                            validWindows.map((activity) => (
                                <div
                                    key={activity.label}
                                    className="flex justify-between items-center bg-background rounded-lg px-3 py-2 border"
                                >
                                    <span className="font-medium flex items-center gap-2">
                                        {/* Renderizamos el componente del icono correctamente */}
                                        <HugeiconsIcon icon={activity.icon} size={20} />
                                        {activity.label}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {activity.data.time.toString().padStart(2, '0')} hs
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic py-2">
                                No hay actividades recomendadas para las próximas horas.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </Card>
    );
};