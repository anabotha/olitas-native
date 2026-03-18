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
console.log("Best Windows:", bestWindows);
    const { seaState } = processedData;
    if (!seaState || !bestWindows) return null;

    const now = new Date().getHours();

    // 1. IMPORTANTE: Guardamos la referencia del componente del icono, no el JSX
    const activities = [
        { label: "Surf ", data: bestWindows.surf, icon: SurfboardIcon },
        { label: "SUP", data: bestWindows.sup, icon: KayakIcon },
        { label: "Natación", data: bestWindows.swimming, icon: SwimmingIcon },
    ];
    // 2. Filtramos ANTES de renderizar para evitar arrays con 'undefined'
 const validWindows = activities.filter(a => {
    if (a.data.time === "N/A") return false;
    
    // Reconstruir fecha desde "19/3, 00:00"
    const [datePart, timePart] = a.data.time.split(', ');
    const [day, month] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    const windowDate = new Date();
    windowDate.setMonth(month - 1, day);
    windowDate.setHours(hour, minute, 0, 0);
    
    const isFuture = windowDate >= new Date();
    
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
                            validWindows.map((activity, idx) => (
                                <div
                                    key={`${activity.label}-${activity.data.time}-${idx}`}
                                    className="flex justify-between items-center bg-background rounded-lg px-3 py-2 border"
                                >
                                    <span className="font-medium flex items-center gap-2">
                                        {/* Renderizamos el componente del icono correctamente */}
                                        <HugeiconsIcon icon={activity.icon} size={20} />
                                        {activity.label}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {activity.data.time.toString()} hs
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