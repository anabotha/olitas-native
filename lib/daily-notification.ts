// Aviso diario de las 19:00 sobre cómo viene el día siguiente.
//
// En el celular no hay cron: cada vez que la app se abre (o el sistema la despierta en
// segundo plano) bajamos el pronóstico, evaluamos el día y dejamos programada una
// notificación local para las próximas 19:00. Si al recalcular cambia el pronóstico,
// se reemplaza la notificación programada.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { resolveSpot } from "@/lib/nearest-spot";
import { loadFavoriteSpots } from "@/lib/favorites";
import { refreshHomeWidget } from "@/lib/home-widget";
import { getMarineWeather } from "@/lib/api/getMarineWeather";
import { getForecast } from "@/lib/api/getForecast";
import { fetchWithOfflineCache } from "@/lib/offline-cache";
import type { SpotLocation } from "@/lib/types";
import { goodPhrase } from "@/lib/phrases";
import { DANGER_WIND_KMH, GOOD_SCORE, evaluateDay, type DayOutlook } from "./day-outlook";
import { loadNotificationPrefs, type NotifActivity, type NotificationPrefs } from "./notification-prefs";

export const NOTIFY_HOUR = 19;
const NOTIFICATION_ID = "olitas-daily";
const BACKGROUND_TASK = "olitas-daily-refresh";

const supported = Platform.OS === "ios" || Platform.OS === "android";

const VERB: Record<NotifActivity, string> = {
  surf: "surfear",
  sup: "hacer SUP",
  swimming: "nadar",
};

const range = (start: Date, end: Date) =>
  start.getTime() === end.getTime() ? `${start.getHours()} h` : `${start.getHours()} a ${end.getHours()} h`;

export type DailyMessage = { title: string; body: string };

export interface SpotOutlook {
  spot: SpotLocation;
  outlook: DayOutlook;
}

/**
 * Arma el mensaje (o null si no hay nada que avisar). El viento peligroso en la playa principal
 * tiene prioridad. Para los días buenos compara la playa principal con las favoritas y avisa
 * la que tenga la mejor ventana.
 */
export function buildDailyMessage(main: SpotOutlook, others: SpotOutlook[], prefs: NotificationPrefs): DailyMessage | null {
  if (prefs.windAlerts && main.outlook.maxWind >= DANGER_WIND_KMH) {
    return {
      title: "Mañana jodidísimo para tabla 💨",
      body: `Viento de hasta ${main.outlook.maxWind} km/h en ${main.spot.name}. Cuidate y metete otro día!`,
    };
  }
  if (!prefs.goodDays) return null;

  // Mejor ventana entre todas; ante empate gana la playa principal
  let top = main;
  for (const o of others) {
    if ((o.outlook.best?.score ?? 0) > (top.outlook.best?.score ?? 0)) top = o;
  }
  const best = top.outlook.best;
  if (!best || best.score < GOOD_SCORE) return null;

  const better = top !== main && (main.outlook.best?.score ?? 0) < best.score ? ` Pinta mejor que ${main.spot.name}.` : "";
  return {
    title: `Che... mañana ${goodPhrase(VERB[best.activity])} 🌊`,
    body: `Caete a ${top.spot.name} de ${range(best.start, best.end)}, no te lo pierdas 🤙${better}`,
  };
}

/** Próximo horario de aviso: hoy a las 19 si todavía no pasó, si no mañana */
function nextNotifyDate(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), NOTIFY_HOUR);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

async function outlookFor(spot: SpotLocation, day: Date, activities: NotifActivity[]): Promise<SpotOutlook> {
  const [data, forecast] = await Promise.all([
    fetchWithOfflineCache("marine", spot.latitude, spot.longitude, () => getMarineWeather(spot.latitude, spot.longitude)).then(r => r.data),
    fetchWithOfflineCache("forecast", spot.latitude, spot.longitude, () => getForecast(spot.latitude, spot.longitude))
      .then(r => r.data)
      .catch(() => undefined),
  ]);
  return { spot, outlook: evaluateDay(day, spot, data, forecast, activities) };
}

/** Evalúa el día siguiente a `notifyAt` (playa principal + favoritas) y devuelve el mensaje a mostrar */
async function computeMessage(notifyAt: Date, prefs: NotificationPrefs): Promise<DailyMessage | null> {
  // Sin pedir permiso: esto también corre en segundo plano
  const spot = await resolveSpot({ ask: false });
  const favorites = (await loadFavoriteSpots()).filter(f => f.name !== spot.name);
  const day = new Date(notifyAt);
  day.setDate(day.getDate() + 1);
  const activities = (Object.keys(prefs.activities) as NotifActivity[]).filter(a => prefs.activities[a]);

  const main = await outlookFor(spot, day, activities);
  // Si una favorita falla (sin datos, sin red), se ignora y se avisa con las demás
  const others = (await Promise.allSettled(favorites.map(f => outlookFor(f, day, activities))))
    .filter((r): r is PromiseFulfilledResult<SpotOutlook> => r.status === "fulfilled")
    .map(r => r.value);
  return buildDailyMessage(main, others, prefs);
}

export async function hasNotificationPermission() {
  if (!supported) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export async function requestNotificationPermission() {
  if (!supported) return false;
  if (await hasNotificationPermission()) return true;
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/** Recalcula y reprograma el aviso de las 19:00 (o lo cancela si está apagado) */
export async function refreshDailyNotification() {
  if (!supported) return;
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});

  const prefs = await loadNotificationPrefs();
  if (!prefs.enabled || !(await hasNotificationPermission())) return;

  const notifyAt = nextNotifyDate();
  const message = await computeMessage(notifyAt, prefs);
  if (!message) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: { ...message, data: { kind: "daily" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
  });
}

/** Manda ya el aviso que saldría a las 19:00, para probar desde el panel */
export async function sendTestNotification(): Promise<DailyMessage | null> {
  const prefs = await loadNotificationPrefs();
  // La prueba siempre habla de mañana (aunque ya hayan pasado las 19 y el próximo aviso sea de pasado)
  const now = new Date();
  const todayAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), NOTIFY_HOUR);
  const message = await computeMessage(todayAt, { ...prefs, enabled: true });
  const content = message ?? {
    title: "Mañana nada especial 🤷",
    body: "No hay ventanas muy buenas ni viento fuerte. A las 19 no te vamos a molestar.",
  };
  if (supported && (await requestNotificationPermission())) {
    await Notifications.scheduleNotificationAsync({ content, trigger: null });
  }
  return content;
}

// ── Segundo plano ─────────────────────────────────────────────
// La tarea se define a nivel de módulo (antes de montar la app) para que el sistema
// pueda ejecutarla aunque la app esté cerrada.
if (supported) {
  TaskManager.defineTask(BACKGROUND_TASK, async () => {
    try {
      // El widget se actualiza aunque los avisos estén apagados
      await Promise.allSettled([refreshDailyNotification(), refreshHomeWidget()]);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Registra (o quita) la actualización en segundo plano del aviso diario y el widget */
export async function syncBackgroundTask(enabled: boolean) {
  if (!supported) return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (enabled && !registered) {
      // El sistema decide cuándo correrla; pedimos como mínimo cada ~2 horas
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, { minimumInterval: 120 });
    } else if (!enabled && registered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK);
    }
  } catch {
    // Expo Go en iOS no soporta tareas en segundo plano: el aviso igual se recalcula al abrir la app
  }
}
