import { ShieldCheck, ShieldOff } from "lucide-react";
import { Card } from "./ui/card";
import { CardHeading } from "./card-heading";
import { cn } from "@/lib/utils";
import {
  LIFEGUARD,
  LIFEGUARD_HOURS_LABEL,
  LIFEGUARD_SEASON_LABEL,
  LIFEGUARD_SEASON_START_LABEL,
  daysUntilSeasonStart,
  getLifeguardStatus,
  isLastSeasonDay,
} from "@/lib/lifeguards";

const pad = (n: number) => String(n).padStart(2, "0");

// Un tono plano por estado (misma paleta que las activity cards): fondo, borde, ícono y número
const TONES = {
  covered: {
    card: "border-teal-200/70 bg-teal-50 dark:border-teal-900/50 dark:bg-teal-950/30",
    icon: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    accent: "text-teal-700 dark:text-teal-400",
  },
  "outside-hours": {
    card: "border-orange-200/70 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300",
    accent: "text-orange-600 dark:text-orange-400",
  },
  // Se acerca el verano: tono cálido, no de alerta
  "off-season": {
    card: "border-amber-200/70 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
    accent: "text-amber-600 dark:text-amber-400",
  },
} as const;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function Lifeguard({ selectedHour }: { selectedHour: Date }) {
  const status = getLifeguardStatus(selectedHour);
  const tone = TONES[status];
  const h = selectedHour.getHours();
  const from = `${pad(LIFEGUARD.from)}:00`;
  const to = `${pad(LIFEGUARD.to)}:00`;

  let title: string;
  // Número protagonista + unidad; null cuando no hay nada que contar
  let count: { n: number; unit: string } | null;
  let message: string;
  let detail: string;

  if (status === "covered") {
    const left = LIFEGUARD.to - h;
    title = "Con guardavidas";
    count = { n: left, unit: plural(left, "hora", "horas") };
    message = "más con guardavidas en la playa";
    detail = `Están hasta las ${to}`;
  } else if (status === "outside-hours") {
    title = `Sin guardavidas a las ${h}:00`;
    if (h < LIFEGUARD.from) {
      const wait = LIFEGUARD.from - h;
      count = { n: wait, unit: plural(wait, "hora", "horas") };
      message = "para que lleguen los guardavidas";
      detail = `Hoy desde las ${from}`;
    } else if (isLastSeasonDay(selectedHour)) {
      count = null;
      message = "Terminó la temporada. Por ahora, nadá con cuidado.";
      detail = `Vuelven el ${LIFEGUARD_SEASON_START_LABEL}`;
    } else {
      const wait = 24 - h + LIFEGUARD.from;
      count = { n: wait, unit: plural(wait, "hora", "horas") };
      message = "para que vuelvan los guardavidas";
      detail = `Mañana desde las ${from}`;
    }
  } else {
    const days = daysUntilSeasonStart(selectedHour);
    title = "Fuera de temporada";
    count = { n: days, unit: plural(days, "día", "días") };
    message = "para que vuelvan los guardavidas";
    detail = `${LIFEGUARD_SEASON_START_LABEL} · ${LIFEGUARD_HOURS_LABEL}`;
  }

  const Icon = status === "covered" ? ShieldCheck : ShieldOff;

  return (
    <Card className={cn("py-0", tone.card)}>
      <div className="grid divide-y divide-border md:grid-cols-2 md:items-center md:divide-x md:divide-y-0">
        <div className="p-5">
          <CardHeading
            icon={<Icon className="h-5 w-5" />}
            iconClassName={tone.icon}
            title={title}
            subtitle={`Temporada ${LIFEGUARD_SEASON_LABEL}`}
          />
        </div>
        <div className="flex items-center gap-4 p-5">
          {count && (
            <div className={cn("flex shrink-0 flex-col items-center leading-none", tone.accent)}>
              <span className="text-4xl font-bold tabular-nums tracking-tight">{count.n}</span>
              <span className="mt-1 text-xs font-semibold">{count.unit}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
