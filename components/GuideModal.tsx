import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";

// Reemplaza al tour de driver.js de la versión web
const STEPS = [
  { title: "🧉 Armá tu plan", text: "Elegí a qué playa vas y a qué hora pensás meterte. El mar cambia rápido, mejor chequear antes de salir." },
  { title: "🤙 ¿Se puede?", text: "Un resumen directo: si está para nadar, remar o mejor esperarse un rato." },
  { title: "⚓ Datos frescos", text: "Lo que está pasando ahora mismo en la costa. Información en tiempo real para tomar la mejor decisión." },
  { title: "⏳ Lo que se viene", text: "Cómo va a estar en las próximas horas. Útil si estás planeando salir más tarde." },
  { title: "🌊 Cómo está el agua", text: "¿Esta subiendo? ¿Esta bajando? Todo lo que necesitás saber antes de entrar." },
  { title: "Estas en la playa?", text: "Si estás ahí y los datos no coinciden con lo que ves, completá el formulario. Tu reporte nos ayuda a mejorar." },
];

export function GuideModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useTheme();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  const close = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.box, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={{ color: c.foreground, fontSize: 18, fontWeight: "700" }}>{STEPS[step].title}</Text>
          <Text style={{ color: c.mutedForeground, fontSize: 15, lineHeight: 22 }}>{STEPS[step].text}</Text>
          <View style={styles.footer}>
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
              {step + 1} de {STEPS.length}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {step > 0 && (
                <Pressable onPress={() => setStep(s => s - 1)} style={[styles.btn, { backgroundColor: c.secondary }]}>
                  <Text style={{ color: c.secondaryForeground, fontWeight: "600" }}>Anterior</Text>
                </Pressable>
              )}
              <Pressable onPress={() => (last ? close() : setStep(s => s + 1))} style={[styles.btn, { backgroundColor: c.primary }]}>
                <Text style={{ color: c.primaryForeground, fontWeight: "600" }}>{last ? "Entendido" : "Siguiente"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#0006", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { width: "100%", maxWidth: 400, borderRadius: 20, borderWidth: 1, padding: 24, gap: 12 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  btn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
});
