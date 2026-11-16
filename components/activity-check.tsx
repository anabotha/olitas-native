import React, { JSX, useState } from 'react'
import { ActivityCard } from './activity-card'
import { WavesIcon, Ship, PersonStanding, AlertCircle, ShieldOff } from 'lucide-react'
import { LIFEGUARD_HOURS_LABEL, getLifeguardStatus } from '@/lib/lifeguard'
import { MarineWeatherData, ForecastData } from '@/lib/types'
import { processData } from '@/hooks/use-processData'
import { SpotLocation } from '@/lib/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { SwimmingIcon } from '@hugeicons/core-free-icons'
import { SurfboardIcon } from '@hugeicons/core-free-icons'
import { KayakIcon } from '@hugeicons/core-free-icons'
import { useRatings } from '@/hooks/use-ratings'
import { useCurrentSafety } from '@/hooks/use-safety'

interface ActivityCheckProps {

  data: MarineWeatherData | undefined;
  selectedSpot: SpotLocation | undefined;
  forecastData: ForecastData | undefined;
  selectedHour: Date;
}

const ActivityCheck = (
  { data, selectedSpot, forecastData, selectedHour }: ActivityCheckProps
): JSX.Element => {
  const processedData = processData(data, forecastData, selectedSpot?.orientation, selectedSpot?.name, selectedHour);
  if (!processedData || !selectedSpot) return <div>Hubo un error, proba mas tarde!</div>;
  const actividad = useRatings(processedData, selectedSpot?.name ?? "", selectedSpot?.orientation ?? 90, selectedSpot, data, forecastData, selectedHour);
  const safety = useCurrentSafety(data, forecastData, selectedSpot, selectedHour);
  const lifeguard = getLifeguardStatus(selectedHour);
  return (
    <section>

      <div className="col-span-3">

        {(safety.color === "red" || safety.color === "yellow") && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {safety.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {safety.message}
              </p>
            </div>
          </div>
        )}
        {lifeguard === "outside-hours" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <ShieldOff className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Sin guardavidas a las {selectedHour.getHours()}:00hs
              </p>
              <p className="text-xs text-muted-foreground">
                Horario de guardavidas: {LIFEGUARD_HOURS_LABEL}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActivityCard
          activity="Nado en aguas abiertas"
          icon={<HugeiconsIcon icon={SwimmingIcon} />}
          rating={actividad.activities.swimming}
        />
        <ActivityCard
          activity="Sup tradicional"
          icon={<HugeiconsIcon icon={KayakIcon} />}
          rating={actividad.activities.sup}
        />

        <ActivityCard
          activity="Surf y SupSurf"
          icon={<HugeiconsIcon icon={SurfboardIcon} />}
          rating={actividad.activities.surf}

        />
      </div>
    </section>

  )
}

export default ActivityCheck
