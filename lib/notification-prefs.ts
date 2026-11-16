import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFICATION_PREFS_KEY = "olitas_notification_prefs";

export type NotifActivity = "surf" | "sup" | "swimming";

export interface NotificationPrefs {
  enabled: boolean; // interruptor general del aviso diario
  goodDays: boolean; // "Che... mañana está buenísimo para ..."
  windAlerts: boolean; // "Mañana jodidísimo para tabla ..."
  activities: Record<NotifActivity, boolean>; // para qué actividades avisar días buenos
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  goodDays: true,
  windAlerts: true,
  activities: { surf: true, sup: true, swimming: true },
};

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const saved = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...saved,
      activities: { ...DEFAULT_NOTIFICATION_PREFS.activities, ...saved.activities },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}
