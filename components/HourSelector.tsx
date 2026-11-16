import { Clock } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { Picker } from "./Picker";

// Desde 2 horas antes de la hora actual hasta 36 horas después
const HOURS_BACK = 2;
const HOURS_AHEAD = 36;

const dayLabel = (d: Date, today: Date) => {
  const diff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86_400_000,
  );
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  return "pasado mañana";
};

function getHours() {
  const entries: { date: Date; label: string }[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  for (let i = -HOURS_BACK; i <= HOURS_AHEAD; i++) {
    const d = new Date(now.getTime() + i * 3_600_000);
    entries.push({ date: d, label: `${dayLabel(d, now)} ${d.getHours()}:00` });
  }
  return entries;
}

export function HourSelector({
  selectedHour,
  onSelectHour,
}: {
  selectedHour: Date;
  onSelectHour: (hour: Date) => void;
}) {
  const c = useTheme();
  const hours = getHours();
  const selected = hours.find(h => h.date.getTime() === selectedHour.getTime());

  return (
    <Picker
      title="Elegí la hora"
      icon={<Clock size={16} color={c.primary} />}
      selectedKey={String(selectedHour.getTime())}
      buttonLabel={selected?.label ?? `${selectedHour.getHours()}:00`}
      options={hours.map(h => ({ key: String(h.date.getTime()), label: h.label, value: h.date }))}
      onSelect={onSelectHour}
    />
  );
}
