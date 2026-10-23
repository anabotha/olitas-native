import { Info, MapPin, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenGuide?: () => void;
  /** Resalta el botón de la guía la primera vez que se entra */
  highlightGuide?: boolean;
}

export function Header({ onOpenGuide, highlightGuide = false }: HeaderProps) {
  return (
    <header id="header" className="sticky top-0 z-40 mb-4 border-b border-chrome-border bg-chrome shadow-sm backdrop-blur-md">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Waves className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Olitas
            </h1>
            <p className="text-xs text-muted-foreground">No te comas el viaje</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
        <a
          href="https://forms.gle/H2A1v53kFRhHn8dE7"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 md:text-sm"
        >
          <MapPin className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">¿Estás en la playa? Contanos</span>
          <span className="sm:hidden">¿En la playa?</span>
        </a>

        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            aria-label="Ver guía"
            className={cn(
              "rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
              highlightGuide && "animate-pulse ring-2 ring-primary"
            )}
          >
            <Info className="h-5 w-5" />
          </button>
        )}
        </div>
      </div>
    </header>
  );
}
