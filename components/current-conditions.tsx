import React from 'react'
import { CombinedConditions, MarineWeatherData } from '@/lib/types'
import { ConditionsPanel } from './conditions-panel'
import { HourlyForecast } from './hourly-forecast'

const CurrentConditions = (
    data: CombinedConditions,
    clima: MarineWeatherData,
) => {
    return (
        <>
            <section>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Condiciones actuales
                </h3>
                <ConditionsPanel conditions={data} />
            </section>

            <section>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Pronostico
                </h3>
                <HourlyForecast forecast={clima.hourlyForecast} />
            </section>
        </>
    )
}

export default CurrentConditions