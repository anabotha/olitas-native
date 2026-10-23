"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ConditionsPanel } from "@/components/conditions-panel";
import { HourlyForecast } from "@/components/hourly-forecast";
import { SpotSelector } from "@/components/spot-selector";
import { LoadingState } from "@/components/loading-state";
import { DEFAULT_SPOTS} from "@/lib/spots";
import type { SpotLocation } from "@/lib/types";
import { AlertCircle, Info } from "lucide-react";
import { useMarineWeather } from "@/hooks/use-marineWeather";
import ActivityCheck from "@/components/activity-check";
import { useForecast } from "@/hooks/use-forecast";
import { SeaState } from "@/components/sea-state";
import { CollapsibleSection } from "@/components/collapsible-section";
import { HourSelector } from "@/components/hour-selector";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
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
  const [spotReady, setSpotReady] = useState(false);


  useEffect(() => {
    const hasVisited = localStorage.getItem('olitas_guide_viewed');
    if (!hasVisited) {
      setShowGuideOnLoad(true);
      localStorage.setItem('olitas_guide_viewed', 'true');
    }
  const saved = localStorage.getItem("olitas_selected_spot");
    if (saved) {
      try {
        setSelectedSpot(JSON.parse(saved));
      } catch {}
    }
    setSpotReady(true);
  }
    , []);




  // No pedimos datos hasta leer el spot guardado, para evitar cargar el default y después recargar
  const activeSpot = spotReady ? selectedSpot : null
  const { data, error, isLoading } = useMarineWeather(activeSpot)
  const { forecastData, forecastIsLoading } = useForecast(activeSpot)
  console.log("forecastData", forecastData)
  const showLoading = !spotReady || isLoading || forecastIsLoading
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
          side: "top"
        }
      },
      {
        element: '#actividad',
        popover: {
          title: '🤙 ¿Se puede?',
          description: 'Un resumen directo: si está para nadar, remar o mejor esperarse un rato.',
          side: "top"
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
          className={`absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full ${showGuideOnLoad ? 'ring-2 ring-blue-400 animate-pulse' : ''
            }`}
        >
          <Info size={24} />
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
        {/* Hero section */}
        <section className="mb-8 gap-4">
          <div className="flex flex-col gap-1" id="selector">
            <h1 className="sr-only">
              Olitas — Condiciones del mar en Comodoro Rivadavia y la costa patagónica
            </h1>
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

          {/* PWA Install prompt */}
          <PwaInstallPrompt />
        </section>

        {showLoading && !error && <LoadingState />}

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

        {data && !error && !showLoading && (
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
              <CollapsibleSection title={`Condiciones ${selectedHour?.getHours()}:00hs`} defaultOpen={true}>
                <ConditionsPanel forecast={forecastData} conditions={data} selectedHour={selectedHour} selectedSpot={selectedSpot} />
              </CollapsibleSection>
            </section>
            <section id="pronostico">
              <CollapsibleSection title={`Pronostico ${selectedHour?.getHours()}:00hs`} defaultOpen={true}>
                <HourlyForecast forecast={forecastData} selectedHour={selectedHour} />
              </CollapsibleSection>
            </section>
            <section id="estado-del-mar">
              <CollapsibleSection title="Estado del Mar" defaultOpen={true}>
                <SeaState data={data} forecast={forecastData} beach={selectedSpot} selectedHour={selectedHour} />
              </CollapsibleSection>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
