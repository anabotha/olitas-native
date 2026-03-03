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
import SeaState from "@/components/sea-state";
import { processData } from "@/hooks/use-processData";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [selectedSpot, setSelectedSpot] = useState<SpotLocation>(
    DEFAULT_SPOTS[0]
  );
  const [selectedActivity, setSelectedActivity] = useState<string>("surf");

  const { data, error, isLoading } = useMarineWeather(selectedSpot)
  const { forecastData, forecastError, forecastIsLoading } = useForecast(selectedSpot)
  console.log("data", data)
  console.log("forecastData", forecastData)
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
        {/* Hero section */}
        <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Como esta hoy?
            </h2>
            <p className="text-pretty text-base text-muted-foreground">
              Oleaje, viento y temperatura para tu proxima sesion.
            </p>
          </div>
          <SpotSelector
            selectedSpot={selectedSpot}
            onSelectSpot={setSelectedSpot}
          />
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
            {/* Activity cards */}
            <ActivityCheck
              selectedActivity={selectedActivity}
              setSelectedActivity={setSelectedActivity}
              selectedSpot={selectedSpot}
              data={data}
              forecastData={forecastData}
            />

            {/* Current conditions */}
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Ahora
              </h3>
              <ConditionsPanel forecast={forecastData} conditions={data} />
            </section>
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Pronostico
              </h3>
              <HourlyForecast forecast={forecastData} />
            </section>
            <section>
              {/* <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Estado del Mar
              </h3> */}
              <SeaState data={data} forecast={forecastData} beach={selectedSpot} />
            </section>
            {/* Footer note */}
            <footer className="pb-4 text-center">
              <p className="text-xs text-muted-foreground">
                Informacion proveida por Open-Meteo. Siempre chequea las condiciones locales antes de salir.
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
