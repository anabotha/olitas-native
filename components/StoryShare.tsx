// Imagen para historia de Instagram (estilo Strava), en dos versiones:
// - Sticker: sin fondo (PNG transparente). Se copia al portapapeles y se pega arriba de una
//   foto en la historia de Instagram, que lo agrega como sticker.
// - Historia: tarjeta 9:16 con fondo, se captura como PNG 1080×1920 y se comparte.
import { ComponentRef, ReactNode, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { Camera, Copy, Share2, Waves, X } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { capitalize, goodPhrase, joinEs } from "@/lib/phrases";

export interface StoryItem {
  name: string; // "Natación"
  verb: string; // "nadar", "surfear", "hacer SUP"
  when: string; // "mañana 7–8 h"
  label: string; // "Muy bueno"
  icon: (props: { size: number; color: string }) => ReactNode;
}

export interface StoryData {
  spot: string;
  items: StoryItem[]; // ventanas elegidas (una o más)
  stats: { label: string; value: string }[]; // Olas / Viento / Temp en la primera ventana
}

// Tamaño de la vista previa; la historia se captura escalada a 1080×1920
const W = 270;
const H = 480;

type Mode = "sticker" | "story";

export function StoryShareButton({ data, disabled }: { data: StoryData; disabled?: boolean }) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Compartir en historia de Instagram"
        style={({ pressed }) => [
          styles.btn,
          { borderColor: c.primary + "66", backgroundColor: c.primary + "1a", opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        ]}
      >
        <Camera size={18} color={c.primary} />
        <Text style={{ color: c.primary, fontWeight: "600", fontSize: 15 }}>Subilo a tu historia</Text>
      </Pressable>
      {/* El Modal abre una vista nativa aparte: necesita su propio SafeAreaProvider en iOS */}
      <Modal transparent visible={open} animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <SafeAreaProvider>
          <StoryShareSheet visible={open} onClose={() => setOpen(false)} data={data} />
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

function StoryShareSheet({ visible, onClose, data }: { visible: boolean; onClose: () => void; data: StoryData }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const card = useRef<ComponentRef<typeof View>>(null);
  const sticker = useRef<ComponentRef<typeof View>>(null);
  const stickerSize = useRef({ width: 0, height: 0 });
  const [mode, setMode] = useState<Mode>("sticker");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  // Una frase por apertura, para que la vista previa y la imagen coincidan
  const verbs = joinEs(data.items.map(i => i.verb));
  const phrase = useMemo(() => capitalize(goodPhrase(verbs)), [visible, verbs]);

  // PNG de la vista activa: la historia a 1080×1920; el sticker a 4× su tamaño, con fondo transparente
  const capture = (result: "tmpfile" | "base64") => {
    if (mode === "story") {
      return captureRef(card, { format: "png", quality: 1, width: 1080, height: 1920, result });
    }
    const { width, height } = stickerSize.current;
    return captureRef(sticker, { format: "png", quality: 1, width: width * 4, height: height * 4, result });
  };

  const run = async (action: () => Promise<string | void>) => {
    setBusy(true);
    setMessage(null);
    try {
      if (Platform.OS === "web") throw new Error("unsupported");
      const ok = await action();
      if (ok) setMessage({ text: ok, ok: true });
    } catch (e) {
      setMessage({
        ok: false,
        text:
          e instanceof Error && e.message === "unsupported"
            ? "Esto funciona en la app del celular."
            : "No se pudo armar la imagen. Probá de nuevo.",
      });
    }
    setBusy(false);
  };

  const share = () =>
    run(async () => {
      if (!(await Sharing.isAvailableAsync())) throw new Error("unsupported");
      const uri = await capture("tmpfile");
      await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: "Compartir en Instagram" });
    });

  const copySticker = () =>
    run(async () => {
      await Clipboard.setImageAsync(await capture("base64"));
      return "¡Copiado! Abrí tu historia en Instagram, elegí una foto y pegalo: queda como sticker.";
    });

  return (
    <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      {/* Tocar afuera cierra */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        hitSlop={12}
        style={[styles.close, { top: insets.top + 8 }]}
      >
        <X size={22} color="#fff" />
      </Pressable>

      <View style={styles.tabs}>
        {(["sticker", "story"] as Mode[]).map(m => (
          <Pressable
            key={m}
            onPress={() => {
              setMode(m);
              setMessage(null);
            }}
            style={[styles.tab, mode === m && { backgroundColor: "#ffffff" }]}
          >
            <Text style={[styles.tabText, mode === m && { color: "#0f3d52" }]}>
              {m === "sticker" ? "Sticker para tu foto" : "Historia con fondo"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Estas vistas son las que se capturan */}
      {mode === "story" ? (
        <View ref={card} collapsable={false} style={styles.card}>
          <StoryCard data={data} phrase={phrase} />
        </View>
      ) : (
        <View style={styles.stickerStage}>
          <View
            ref={sticker}
            collapsable={false}
            onLayout={e => (stickerSize.current = e.nativeEvent.layout)}
            style={styles.sticker}
          >
            <StickerCard data={data} phrase={phrase} />
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {mode === "sticker" && (
          <Pressable
            onPress={copySticker}
            disabled={busy}
            style={({ pressed }) => [styles.shareBtn, { backgroundColor: c.primary, opacity: pressed || busy ? 0.8 : 1 }]}
          >
            <Copy size={18} color={c.primaryForeground} />
            <Text style={{ color: c.primaryForeground, fontWeight: "700", fontSize: 15 }}>
              {busy ? "Armando..." : "Copiar sticker"}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={share}
          disabled={busy}
          style={({ pressed }) => [
            styles.shareBtn,
            mode === "story" ? { backgroundColor: c.primary } : { borderWidth: 1, borderColor: "#ffffff80" },
            { opacity: pressed || busy ? 0.8 : 1 },
          ]}
        >
          {mode === "story" ? <Camera size={18} color={c.primaryForeground} /> : <Share2 size={18} color="#fff" />}
          <Text style={{ color: mode === "story" ? c.primaryForeground : "#fff", fontWeight: "700", fontSize: 15 }}>
            {busy && mode === "story" ? "Armando la imagen..." : "Compartir"}
          </Text>
        </Pressable>
      </View>

      {message && <Text style={[styles.message, message.ok && { color: "#bbf7d0" }]}>{message.text}</Text>}

      <Pressable onPress={onClose} hitSlop={8}>
        <Text style={styles.cancel}>Cerrar</Text>
      </Pressable>
    </View>
  );
}

// Sticker sin fondo: texto blanco con sombra para que se lea arriba de cualquier foto
function StickerCard({ data, phrase }: { data: StoryData; phrase: string }) {
  return (
    <View style={{ gap: 8, alignItems: "center" }}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Waves size={14} color="#0f3d52" />
        </View>
        <Text style={[styles.brandText, styles.shadow]}>Olitas</Text>
      </View>
      <View style={[styles.icons, { marginTop: 4 }]}>
        {data.items.map(i => (
          <View key={i.name} style={styles.stickerIcon}>
            {i.icon({ size: 24, color: "#0f3d52" })}
          </View>
        ))}
      </View>
      <Text
        style={[styles.phrase, styles.shadow, { textAlign: "center" }, data.items.length > 1 && { fontSize: 24, lineHeight: 28 }]}
      >
        {phrase}
      </Text>
      <Text style={[styles.spot, styles.shadow, { color: "#ffffff" }]}>{data.spot}</Text>
      {data.items.map(i => (
        <Text key={i.name} style={[styles.stickerWhen, styles.shadow]}>
          {i.name} · {capitalize(i.when)}
        </Text>
      ))}
      <View style={[styles.stats, { borderTopColor: "#ffffffcc", alignSelf: "stretch", marginTop: 6 }]}>
        {data.stats.map(s => (
          <View key={s.label} style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.statLabel, styles.shadow, { color: "#ffffff" }]}>{s.label}</Text>
            <Text style={[styles.statValue, styles.shadow]} numberOfLines={1}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Historia con fondo: degradé de mar + olas abajo
function StoryCard({ data, phrase }: { data: StoryData; phrase: string }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0f3d52" />
            <Stop offset="0.55" stopColor="#1f6f8f" />
            <Stop offset="1" stopColor="#3dc9a9" />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#sea)" />
        <Path d={`M0 ${H - 90} C 45 ${H - 110}, 90 ${H - 70}, 135 ${H - 90} S 225 ${H - 110}, ${W} ${H - 90} V ${H} H 0 Z`} fill="#ffffff" opacity={0.08} />
        <Path d={`M0 ${H - 60} C 45 ${H - 80}, 90 ${H - 40}, 135 ${H - 60} S 225 ${H - 80}, ${W} ${H - 60} V ${H} H 0 Z`} fill="#ffffff" opacity={0.1} />
      </Svg>

      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Waves size={14} color="#0f3d52" />
          </View>
          <Text style={styles.brandText}>Olitas</Text>
        </View>

        <View style={{ gap: 10 }}>
          <View style={styles.icons}>
            {data.items.map(i => (
              <View key={i.name} style={styles.iconBubble}>
                {i.icon({ size: 26, color: "#ffffff" })}
              </View>
            ))}
          </View>
          <Text style={[styles.phrase, data.items.length > 1 && { fontSize: 26, lineHeight: 30 }]}>{phrase}</Text>
          <Text style={styles.spot}>{data.spot}</Text>
          {data.items.map(i => (
            <View key={i.name} style={styles.pill}>
              <Text style={styles.pillText}>
                {i.name} · {capitalize(i.when)} · {i.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 14 }}>
          <View style={styles.stats}>
            {data.stats.map(s => (
              <View key={s.label} style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.url}>olitas.anabotha.dev</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
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
  tabs: { flexDirection: "row", backgroundColor: "#ffffff26", borderRadius: 999, padding: 3 },
  tab: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  tabText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  card: { width: W, height: H, borderRadius: 18, overflow: "hidden", backgroundColor: "#0f3d52" },
  // Fondo de muestra detrás del sticker (no se captura): simula una foto
  stickerStage: {
    width: W,
    height: H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#6b7f86",
    alignItems: "center",
    justifyContent: "center",
  },
  sticker: { width: W - 40, paddingVertical: 12, paddingHorizontal: 8 },
  stickerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  stickerWhen: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  shadow: { textShadowColor: "#00000080", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  actions: { flexDirection: "row", gap: 10 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22 },
  message: { color: "#fecaca", fontSize: 13, textAlign: "center", maxWidth: 300 },
  cancel: { color: "#ffffffcc", fontSize: 15, fontWeight: "600", paddingVertical: 4 },
  content: { flex: 1, padding: 22, justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 24, height: 24, borderRadius: 7, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  brandText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  phrase: { color: "#ffffff", fontSize: 30, fontWeight: "800", lineHeight: 34, letterSpacing: -0.5 },
  spot: { color: "#d7f3f0", fontSize: 15, fontWeight: "600" },
  icons: { flexDirection: "row", gap: 8 },
  iconBubble: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#ffffff26", alignItems: "center", justifyContent: "center" },
  pill: { alignSelf: "flex-start", backgroundColor: "#ffffff26", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  stats: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#ffffff40", paddingTop: 12 },
  statLabel: { color: "#ffffffb3", fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  statValue: { color: "#ffffff", fontSize: 17, fontWeight: "700", marginTop: 2 },
  url: { color: "#ffffffcc", fontSize: 11, fontWeight: "600", textAlign: "center" },
});
