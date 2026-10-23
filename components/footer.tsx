import { Globe, Mail, MapPin, TriangleAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-chrome-border bg-chrome">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-6 text-center">
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-left text-xs font-medium text-warning-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Siempre chequeá las condiciones antes de salir al agua.</span>
        </div>

        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <a
            href="mailto:josefinabotha@gmail.com"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Mail className="h-4 w-4" />
            Contacto
          </a>
          <span className="h-4 w-px bg-border" aria-hidden />
          <a
            href="https://anabotha.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Globe className="h-4 w-4" />
            Portfolio
          </a>
          <span className="h-4 w-px bg-border" aria-hidden />
          <a
            href="https://forms.gle/H2A1v53kFRhHn8dE7"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4" />
            ¿En la playa?
          </a>
        </nav>

        <p className="text-[11px] text-muted-foreground/70">
          Olitas · Datos por{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-primary hover:underline"
          >
            Open-Meteo
          </a>
        </p>

        <p className="-mt-3 max-w-md text-[10px] leading-relaxed text-muted-foreground/60">
          Los datos son pronósticos y pueden no ser exactos. Olitas es una guía orientativa y no se
          responsabiliza por decisiones tomadas en base a esta información.
        </p>
      </div>
    </footer>
  );
}
