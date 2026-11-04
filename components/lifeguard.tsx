import { ShieldCheck, ShieldOff } from "lucide-react";
import {
  LIFEGUARD_HOURS_LABEL,
  LIFEGUARD_SEASON_LABEL,
  getLifeguardStatus,
} from "@/lib/lifeguards";

export function Lifeguard({ selectedHour }: { selectedHour: Date }) {
  const status = getLifeguardStatus(selectedHour);
  const covered = status === "covered";
  const hour = `${selectedHour.getHours()}:00hs`;

  const badge =
    status === "covered"
      ? `Con guardavidas a las ${hour}`
      : status === "outside-hours"
        ? `Sin guardavidas a las ${hour}`
        : "Fuera de temporada";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        {covered ? (
          <ShieldCheck className="h-5 w-5 text-accent" />
        ) : (
          <ShieldOff className="h-5 w-5 text-amber-500" />
        )}
        <p className="text-sm font-semibold text-foreground">{badge}</p>
      </div>
      <p className="text-[13px] text-muted-foreground">
        Horario: {LIFEGUARD_HOURS_LABEL}<br/>Temporada: {LIFEGUARD_SEASON_LABEL} 
      </p>
    </div>
  );
}
