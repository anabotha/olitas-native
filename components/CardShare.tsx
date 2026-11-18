// Compartir una tarjeta tal cual se ve: se captura la vista como PNG (con fondo transparente en las
// esquinas) y se ofrece copiarla, para pegarla como sticker en una historia, o compartirla.
import { ComponentRef, ReactNode, useRef, useState } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { Copy, Share2, X } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

type Capture = { base64: string; uri: string };

/**
 * Envuelve una tarjeta para poder compartirla. `children` recibe el botón de compartir
 * (o null mientras se captura, para que el botón no salga en la imagen).
 */
export function ShareableCard({ children }: { children: (shareButton: ReactNode) => ReactNode }) {
  const c = useTheme();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [capturing, setCapturing] = useState(false);
  const [shot, setShot] = useState<Capture | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    if (Platform.OS === "web") {
      setShot({ base64: "", uri: "" });
      setError("Compartir la tarjeta funciona en la app del celular.");
      return;
    }
    setCapturing(true);
    // Esperamos un cuadro para que el botón desaparezca antes de sacar la foto
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const opts = { format: "png" as const, quality: 1 };
      const uri = await captureRef(ref, { ...opts, result: "tmpfile" });
      const base64 = await captureRef(ref, { ...opts, result: "base64" });
      setShot({ uri, base64 });
    } catch {
      setShot({ base64: "", uri: "" });
      setError("No se pudo armar la imagen. Probá de nuevo.");
    }
    setCapturing(false);
  };

  const button = capturing ? null : (
    <Pressable
      onPress={start}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Compartir tarjeta"
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: c.secondary, opacity: pressed ? 0.7 : 1 }]}
    >
      <Share2 size={16} color={c.secondaryForeground} />
    </Pressable>
  );

  return (
    <>
      <View ref={ref} collapsable={false}>
        {children(button)}
        {/* Publicidad gratis, como Strava: solo sale en la imagen */}
        {capturing && (
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.mutedForeground }]}>olitas.anabotha.dev</Text>
          </View>
        )}
      </View>
      <Modal transparent visible={!!shot} animationType="fade" statusBarTranslucent onRequestClose={() => setShot(null)}>
        <SafeAreaProvider>
          {shot && <ShareSheet shot={shot} initialError={error} onClose={() => setShot(null)} />}
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

function ShareSheet({ shot, initialError, onClose }: { shot: Capture; initialError: string | null; onClose: () => void }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    initialError ? { text: initialError, ok: false } : null,
  );
  const [ratio, setRatio] = useState(1.6);

  const copy = async () => {
    try {
      await Clipboard.setImageAsync(shot.base64);
      setMessage({ ok: true, text: "¡Copiada! Abrí tu historia en Instagram, elegí una foto y pegala: queda como sticker." });
    } catch {
      setMessage({ ok: false, text: "No se pudo copiar. Probá con Compartir." });
    }
  };

  const share = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error();
      await Sharing.shareAsync(shot.uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: "Compartir tarjeta" });
    } catch {
      setMessage({ ok: false, text: "No se pudo compartir la imagen." });
    }
  };

  return (
    <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
      <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar" style={[styles.close, { top: insets.top + 8 }]}>
        <X size={22} color="#fff" />
      </Pressable>

      {shot.uri ? (
        <Image
          source={{ uri: shot.uri }}
          onLoad={e => {
            const { width, height } = e.nativeEvent.source;
            if (width && height) setRatio(width / height);
          }}
          style={[styles.preview, { aspectRatio: ratio }]}
          resizeMode="contain"
        />
      ) : null}

      {shot.uri ? (
        <View style={styles.actions}>
          <Pressable onPress={copy} style={({ pressed }) => [styles.btn, { backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 }]}>
            <Copy size={18} color={c.primaryForeground} />
            <Text style={{ color: c.primaryForeground, fontWeight: "700", fontSize: 15 }}>Copiar imagen</Text>
          </Pressable>
          <Pressable
            onPress={share}
            style={({ pressed }) => [styles.btn, { borderWidth: 1, borderColor: "#ffffff80", opacity: pressed ? 0.8 : 1 }]}
          >
            <Share2 size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Compartir</Text>
          </Pressable>
        </View>
      ) : null}

      {message && <Text style={[styles.message, message.ok && { color: "#bbf7d0" }]}>{message.text}</Text>}

      <Pressable onPress={onClose} hitSlop={8}>
        <Text style={styles.cancel}>Cerrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: "center", paddingTop: 8 },
  footerText: { fontSize: 12, fontWeight: "600" },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  backdrop: { flex: 1, backgroundColor: "#000000d9", alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 16 },
  close: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff26",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  preview: { width: "100%", maxWidth: 420 },
  actions: { flexDirection: "row", gap: 10 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22 },
  message: { color: "#fecaca", fontSize: 13, textAlign: "center", maxWidth: 300 },
  cancel: { color: "#ffffffcc", fontSize: 15, fontWeight: "600", paddingVertical: 4 },
});
