"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { ConditionsPanel } from "@/components/conditions-panel";
import { HourlyForecast } from "@/components/hourly-forecast";
import { SpotSelector } from "@/components/spot-selector";
import { LoadingState } from "@/components/loading-state";
import { DEFAULT_SPOTS } from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { AlertCircle, Info } from "lucide-react";
import { useMarineWeather } from "@/hooks/use-marineWeather";
import ActivityCheck from "@/components/activity-check";
import { useForecast } from "@/hooks/use-forecast";
import { SeaState } from "@/components/sea-state";
import { CollapsibleSection } from "@/components/collapsible-section";
import { HourSelector } from "@/components/hour-selector";
import "driver.js/dist/driver.css";

import { driver } from "driver.js";

export default function Home() {
  const [selectedSpot, setSelectedSpot] = useState<SpotLocation>(
    DEFAULT_SPOTS[0]
  );

  const [selectedHour, setSelectedHour] = useState<Date>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });
  const [showGuideOnLoad, setShowGuideOnLoad] = useState(false);
  // const [selectedActivity, setSelectedActivity] = useState<string>("surf");

  useEffect(() => {
    const hasVisited = localStorage.getItem('olitas_guide_viewed');
    if (!hasVisited) {
      setShowGuideOnLoad(true);
      localStorage.setItem('olitas_guide_viewed', 'true');
    }
  }, []);

  const { data, error, isLoading } = useMarineWeather(selectedSpot)
  const { forecastData, forecastError, forecastIsLoading } = useForecast(selectedSpot)
  const driverObj = driver({
    showProgress: true,
    popoverClass: 'bg-white rounded-[20px] shadow-2xl p-6 font-sans',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Entendido',
    steps: [
      {
        element: '#selector',
        popover: {
          title: '🧉 Armá tu plan',
          description: 'Elegí a qué playa vas y a qué hora pensás meterte. El mar cambia rápido, mejor chequear antes de salir.',
          side: "bottom"
        }
      },
      {
        element: '#actividad',
        popover: {
          title: '🤙 ¿Se puede?',
          description: 'Un resumen directo: si está para nadar, remar o mejor esperarse un rato.',
          side: "bottom"
        }
      },
      {
        element: '#ahora',
        popover: {
          title: '⚓ Datos frescos',
          description: 'Lo que está pasando ahora mismo en la costa. Información en tiempo real para tomar la mejor decisión.',
          side: "top"
        }
      },
      {
        element: '#pronostico',
        popover: {
          title: '⏳ Lo que se viene',
          description: 'Cómo va a estar en las próximas horas. Útil si estás planeando salir más tarde.',
          side: "top"
        }
      },

      {
        element: '#estado-del-mar',
        popover: {
          title: '🌊 Cómo está el agua',
          description: '¿Esta subiendo? ¿Esta bajando? Todo lo que necesitás saber antes de entrar.',
          side: "left"
        }
      },
      {
        element: '#header',
        popover: {
          title: 'Estas en la playa?',
          description: 'Si estás ahí y los datos no coinciden con lo que ves, completá el formulario. Tu reporte nos ayuda a mejorar.',
          side: "top"
        }
      },
    ]
  });




  return (
    <div className="min-h-screen bg-background">
      <header id="header" >
        <Header />


        <button
          onClick={() => driverObj.drive()}
          className={`absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full ${
            showGuideOnLoad ? 'ring-2 ring-blue-400 animate-pulse' : ''
          }`}
        >
          <Info size={24} />
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
        {/* Hero section */}
        <section className="mb-8 gap-4">
          <div className="flex flex-col gap-1" id="selector">
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
                No se pudieron cargar los datos :{"("}
              </p>
              <p className="text-xs text-muted-foreground">
                Intenta de nuevo en un momento. El mar no se va a ningun lado.
              </p>
            </div>
          </div>
        )}

        {data && !error && (
          <div className="flex flex-col gap-8">

            <CollapsibleSection title="actividad" defaultOpen={true}>
              <div id="actividad">

                {/* Activity cards */}
                <ActivityCheck

                  selectedSpot={selectedSpot}
                  data={data}
                  forecastData={forecastData}
                  selectedHour={selectedHour}
                />
              </div>
            </CollapsibleSection>

            {/* Current conditions */}
            <section id="ahora">
              <CollapsibleSection title="ahora" defaultOpen={true}>
                <ConditionsPanel forecast={forecastData} conditions={data} selectedSpot={selectedSpot} />
              </CollapsibleSection>
            </section>
            <section id="pronostico">
              <CollapsibleSection title="Pronostico" defaultOpen={true}>
                <HourlyForecast forecast={forecastData} />
              </CollapsibleSection>
            </section>
            <section id="estado-del-mar">
              <CollapsibleSection title="Estado del Mar" defaultOpen={true}>
                <SeaState data={data} forecast={forecastData} beach={selectedSpot} />
              </CollapsibleSection>
            </section>
            {/* Footer note */}
            <footer className="pb-8 text-center space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  Datos meteorológicos por Open-Meteo
                </p>
                <p className="text-xs font-medium text-destructive/80">
                  Siempre chequeá las condiciones antes de salir al agua.
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 w-1/4 mx-auto">
                <a
                  href="mailto:josefinabotha@gmail.com"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Contacto: <span className="font-medium underline underline-offset-4">josefinabotha@gmail.com</span>
                </a>
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
