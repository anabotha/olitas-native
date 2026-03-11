import React from 'react'
import { CombinedConditions, MarineWeatherData } from '@/lib/types'
import { ConditionsPanel } from './conditions-panel'
import { HourlyForecast } from './hourly-forecast'
import { ForecastData } from '@/lib/types'

export const CurrentConditions = ({
    forecast
}: {
    forecast: ForecastData
}) => {
    return (
        <>

            <section>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Pronostico
                </h3>
                <HourlyForecast forecast={forecast} />
            </section>
        </>
    )
}