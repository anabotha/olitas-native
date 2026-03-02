import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CombinedConditions, ForecastData, MarineWeatherData, SpotLocation } from '@/lib/types';
import { processData } from '@/hooks/use-processData';

const SeaState = ({ data, forecast, beach }: { data: MarineWeatherData, forecast: ForecastData, beach: SpotLocation }) => {
    const processedData = processData(data, forecast, beach.orientation);
    if (!processedData) return null;
    const { seaState } = processedData;
    return (
        <Card>
            <CardHeader>
                <CardTitle>Estado del Mar</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{seaState.condition}</p>
                <p>{seaState.tideInfo.stage}</p>
                <p>{seaState.tideInfo.isRising ? "Subiendo" : "Bajando"}</p>
            </CardContent>
        </Card>
    )
}

export default SeaState