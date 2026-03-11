import React, { JSX, useState } from 'react'
import { ActivityCard } from './activity-card'
import { WavesIcon, Ship, PersonStanding, AlertCircle } from 'lucide-react'
import { MarineWeatherData, ForecastData } from '@/lib/types'
import { processData } from '@/hooks/use-processData'
import { SpotLocation } from '@/lib/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { SwimmingIcon } from '@hugeicons/core-free-icons'
import { SurfboardIcon } from '@hugeicons/core-free-icons'
import { KayakIcon } from '@hugeicons/core-free-icons'
import { useRatings } from '@/hooks/use-ratings'

interface ActivityCheckProps {

  data: MarineWeatherData | undefined;
  selectedSpot: SpotLocation | undefined;
  forecastData: ForecastData | undefined;
  selectedHour: Date;
}

const ActivityCheck = (
  { data, selectedSpot, forecastData, selectedHour }: ActivityCheckProps
): JSX.Element => {
  const processedData = processData(data, forecastData, selectedSpot?.orientation, selectedSpot?.name);
  if (!processedData || !selectedSpot) return <div>Hubo un error, proba mas tarde!</div>;
  const actividad = useRatings(processedData, selectedSpot?.name ?? "", selectedSpot?.orientation ?? 90, selectedSpot, data, forecastData, selectedHour);
  return (
    <section>
      {/* <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Actividad
      </h3> */}
      <div className="col-span-3">

        {processedData.safety?.color === "red" || processedData.safety?.color === "yellow" && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {processedData.safety.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {processedData.safety.message}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActivityCard
          activity="Surf y SupSurf"
          icon={<HugeiconsIcon icon={SurfboardIcon} />}
          rating={actividad.activities.surf}

        />
        <ActivityCard
          activity="Sup de Tierra"
          icon={<HugeiconsIcon icon={KayakIcon} />}
          rating={actividad.activities.sup}
        />
        <ActivityCard
          activity="Nado en aguas abiertas"
          icon={<HugeiconsIcon icon={SwimmingIcon} />}
          rating={actividad.activities.swimming}
        />
      </div>
    </section>

  )
}

export default ActivityCheck
