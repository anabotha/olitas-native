import { Linking, Pressable, StyleSheet, Text } from "react-native";
import { MessageCircle } from "lucide-react-native";
import { APP_URL } from "@/lib/links";
import { closer, goodPhrase, joinEs } from "@/lib/phrases";

const WHATSAPP_GREEN = "#25D366";

/**
 * Abre WhatsApp con el mensaje ya escrito para que el usuario elija a quién mandarlo.
 * En el celular `wa.me` abre la app de WhatsApp; en la compu abre WhatsApp Web.
 */
export function shareOnWhatsApp(text: string) {
  return Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

export interface ShareItem {
  verb: string; // "nadar"
  when: string; // "mañana 7–8 h"
}

/**
 * "Che, mañana 7–8 h está god para nadar y hacer SUP en Costanera Comodoro 🌊 ¿Quién se prende?"
 * Si las ventanas son a distintas horas: "Che, alto día para nadar (mañana 7–8 h) y hacer SUP (hoy 15–17 h) en ..."
 */
export function buildShareText(spot: string, items: ShareItem[]) {
  const sameWhen = items.every(i => i.when === items[0].when);
  const what = sameWhen
    ? `${items[0].when} ${goodPhrase(joinEs(items.map(i => i.verb)))}`
    : goodPhrase(joinEs(items.map(i => `${i.verb} (${i.when})`)));
  return `Che, ${what} en ${spot} 🌊 ${closer()}\n\nFijate en Olitas 👉 ${APP_URL}`;
}

export function ShareWhatsAppButton({ text, disabled }: { text: string; disabled?: boolean }) {
  return (
    <Pressable
      onPress={() => shareOnWhatsApp(text).catch(() => {})}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Mandale a tus amigos por WhatsApp"
      style={({ pressed }) => [styles.btn, { opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}
    >
      <MessageCircle size={18} color="#fff" />
      <Text style={styles.text}>Mandale a tus amigos</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
