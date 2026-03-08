"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/header";
import { ActivityCard } from "@/components/activity-card";
import { ConditionsPanel } from "@/components/conditions-panel";
import { HourlyForecast } from "@/components/hourly-forecast";
import { SpotSelector } from "@/components/spot-selector";
import { LoadingState } from "@/components/loading-state";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { CombinedConditions, SpotLocation } from "@/lib/types";
import { PersonStanding, Ship, Waves as WavesIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { useMarineWeather } from "@/hooks/use-marineWeather";
import ActivityCheck from "@/components/activity-check";
import { useForecast } from "@/hooks/use-forecast";
import { CurrentConditions } from "@/components/current-conditions";
import { SeaState } from "@/components/sea-state";
import { CollapsibleSection } from "@/components/collapsible-section";
import { processData } from "@/hooks/use-processData";
import { HourSelector } from "@/components/hour-selector";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [selectedSpot, setSelectedSpot] = useState<SpotLocation>(
    DEFAULT_SPOTS[0]
  );
  const [selectedHour, setSelectedHour] = useState<Date>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });
  // const [selectedActivity, setSelectedActivity] = useState<string>("surf");

  const { data, error, isLoading } = useMarineWeather(selectedSpot)
  const { forecastData, forecastError, forecastIsLoading } = useForecast(selectedSpot)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
        {/* Hero section */}
        <section className="mb-8 gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="flex flex-wrap items-center gap-x-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              ¿Cómo está{" "}
              <HourSelector selectedHour={selectedHour} onSelectHour={setSelectedHour} variant="inline" />
              {" "}en{" "}
              <SpotSelector selectedSpot={selectedSpot} onSelectSpot={setSelectedSpot} variant="inline" />
              {"?"}
            </h2>
            <p className="text-pretty text-base text-muted-foreground">
              Oleaje, viento y temperatura para tu próxima sesión.
            </p>
          </div>
        </section>

        {isLoading && <LoadingState />}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No se pudieron cargar los datos :${"("}
              </p>
              <p className="text-xs text-muted-foreground">
                Intenta de nuevo en un momento. El mar no se va a ningun lado.
              </p>
            </div>
          </div>
        )}

        {data && !error && (
          <div className="flex flex-col gap-8">
            <CollapsibleSection title="Actividad" defaultOpen={true}>

              {/* Activity cards */}
              <ActivityCheck

                selectedSpot={selectedSpot}
                data={data}
                forecastData={forecastData}
                selectedHour={selectedHour}
              />
            </CollapsibleSection>

            {/* Current conditions */}
            <section>
              <CollapsibleSection title="Ahora" defaultOpen={true}>
                <ConditionsPanel forecast={forecastData} conditions={data} selectedSpot={selectedSpot} />
              </CollapsibleSection>
            </section>
            <section>
              <CollapsibleSection title="Pronostico" defaultOpen={true}>
                <HourlyForecast forecast={forecastData} />
              </CollapsibleSection>
            </section>
            <section>
              <CollapsibleSection title="Estado del Mar" defaultOpen={true}>
                <SeaState data={data} forecast={forecastData} beach={selectedSpot} />
              </CollapsibleSection>
            </section>
            {/* Footer note */}
            <footer className="pb-4 text-center">
              <p className="text-xs text-muted-foreground">
                Informacion provista por Open-Meteo. <br /> Siempre chequea las condiciones antes de salir.
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
