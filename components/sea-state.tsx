import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CombinedConditions, ForecastData, MarineWeatherData, SpotLocation } from '@/lib/types';
import { processData } from '@/hooks/use-processData';
import { se } from 'date-fns/locale';
import { HugeiconsIcon } from '@hugeicons/react';
import { KayakIcon, SwimmingIcon, SurfboardIcon } from '@hugeicons/core-free-icons';

interface SeaStateProps {
    data: MarineWeatherData;
    forecast: ForecastData | undefined;
    beach: SpotLocation;
}

const SeaState = ({ data, forecast, beach }: SeaStateProps) => {
    const processedData = processData(data, forecast, beach.orientation);
    if (!processedData) return null;
    const { seaState, bestWindows } = processedData;
    const activities = [
        { label: "Surf", data: bestWindows.surf, icon: <HugeiconsIcon icon={SurfboardIcon} /> },
        { label: "SUP", data: bestWindows.sup, icon: <HugeiconsIcon icon={KayakIcon} /> },
        { label: "Natación", data: bestWindows.swimming, icon: <HugeiconsIcon icon={SwimmingIcon} /> },
    ];

    const validWindows = activities.filter(a => a.data.score > 5);
    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    Estado del Mar
                </CardTitle>
            </CardHeader>

            <section className="grid md:grid-cols-2 gap-6 p-4">

                <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">
                        Condición
                    </p>
                    <p className="text-xl font-semibold">
                        {seaState.condition}
                    </p>

                    <p className="text-sm uppercase tracking-wide text-muted-foreground mt-4">
                        Marea
                    </p>
                    <p className="text-xl font-semibold">
                        {seaState.tideInfo}
                    </p>
                </div>

                <div className="bg-muted/40 rounded-xl p-4">
                    {validWindows.length > 0 ? (
                        <>
                            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
                                Posibles Ventanas
                            </p>

                            <div className="space-y-2">
                                {validWindows.map((activity) => {
                                    const hour = Number(activity.data.time)
                                    const ampm = hour <= 11 ? "AM" : "PM"

                                    return (
                                        <div
                                            key={activity.label}
                                            className="flex justify-between items-center bg-background rounded-lg px-3 py-2 border"
                                        >
                                            <span className="font-medium flex items-center gap-2">
                                                {activity.icon} {activity.label}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {activity.data.time} {ampm}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground">
                            No se prevén buenas condiciones
                        </p>
                    )}
                </div>

            </section>
        </Card>
    )
}

export default SeaState