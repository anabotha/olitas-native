import React, { JSX, useState } from 'react'
import { ActivityCard } from './activity-card'
import { WavesIcon, Ship, PersonStanding } from 'lucide-react'
import { MarineWeatherData, ForecastData } from '@/lib/types'
import { processData } from '@/hooks/use-processData'
import { SpotLocation } from '@/lib/types'

interface ActivityCheckProps {
  selectedActivity: string,
  setSelectedActivity: (activity: string) => void,
  data: MarineWeatherData | undefined;
  selectedSpot: SpotLocation | undefined;
  forecastData: ForecastData | undefined;
}

const ActivityCheck = (
  { selectedActivity, setSelectedActivity, data, selectedSpot, forecastData }: ActivityCheckProps
): JSX.Element => {
  const processedData = processData(data, forecastData, selectedSpot?.orientation);
  if (!processedData) return <div>Hubo un error, proba mas tarde!</div>;
  return (
    <section>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Actividad
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActivityCard
          activity="Surfing"
          icon={<WavesIcon className="h-5 w-5" />}
          rating={processedData.activities.surf}
          isSelected={selectedActivity === "surf"}
          onClick={() => setSelectedActivity("surf")}
        />
        <ActivityCard
          activity="SUP"
          icon={<Ship className="h-5 w-5" />}
          rating={processedData.activities.sup}
          isSelected={selectedActivity === "sup"}
          onClick={() => setSelectedActivity("sup")}
        />
        <ActivityCard
          activity="Nado en aguas abiertas"
          icon={<PersonStanding className="h-5 w-5" />}
          rating={processedData.activities.swimming}
          isSelected={selectedActivity === "swimming"}
          onClick={() => setSelectedActivity("swimming")}
        />
      </div>
    </section>

  )
}

export default ActivityCheck
