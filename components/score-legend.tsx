import { cn } from "@/lib/utils";
import { getScoreSegmentColor } from "./activity-card";

// Misma escala que getScore* en activity-card (puntaje 0–10)
const LEVELS = [
    { score: 0, range: "0", label: "Peligroso", hint: "Mejor no meterse" },
    { score: 1, range: "1–2", label: "Jodido", hint: "Solo surf: complicado" },
    { score: 5, range: "2–5", label: "Flojo", hint: "No es peligroso, pero no está lindo" },
    { score: 7, range: "6–7", label: "Bien", hint: "Condiciones decentes" },
    { score: 9, range: "8–9", label: "Muy bueno", hint: "Vale la pena ir" },
    { score: 10, range: "10", label: "Excelente", hint: "Día ideal: arrancá para la playa" },
];

export function ScoreLegend() {
    return (
        <div className="flex flex-col gap-1.5 py-0.5 text-left">
            <p className="font-semibold">¿Cómo leer el puntaje?</p>
            <ul className="flex flex-col gap-1">
                {LEVELS.map(level => (
                    <li key={level.range} className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", getScoreSegmentColor(level.score))} aria-hidden />
                        <span className="whitespace-nowrap font-medium">{level.label}</span>
                        <span className="opacity-70">· {level.hint}</span>
                    </li>
                ))}
            </ul>
            <p className="opacity-70">Las etiquetas pueden variar según la actividad.</p>
        </div>
    );
}
