import { Clock } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { Picker } from "./Picker";

// Hoy desde la hora actual hasta las 23, y mañana desde las 0 hasta la hora actual
function getHours() {
  const entries: { date: Date; label: string }[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  for (let i = currentHour; i < 24; i++) {
    const d = new Date(now);
    d.setHours(i, 0, 0, 0);
    entries.push({ date: d, label: `hoy ${i}:00` });
  }
  for (let i = 0; i < currentHour; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(i, 0, 0, 0);
    entries.push({ date: d, label: `mañana ${i}:00` });
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
