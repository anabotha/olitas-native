// Widget de la pantalla de inicio (iOS). Se dibuja con SwiftUI a través de @expo/ui:
// acá no se pueden usar componentes de React Native, hooks ni constantes de afuera de la función.
// Solo funciona en la app compilada (EAS), no en Expo Go.
import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundColor, lineLimit, minimumScaleFactor, opacity } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export interface OlitasWidgetProps {
  spot: string; // "Costanera Comodoro"
  headline: string; // "Alto día para nadar" / "Nada destacable"
  detail: string; // "Mañana 7–8 h · Muy bueno"
  symbol: string; // SF Symbol de la actividad
  updated: string; // "Actualizado 18:40"
}

const OlitasWidget = (props: OlitasWidgetProps, environment: WidgetEnvironment) => {
  "widget";
  const medium = environment.widgetFamily === "systemMedium";
  return (
    <VStack alignment="leading" spacing={4} modifiers={[containerBackground("#0f3d52", "widget")]}>
      <HStack spacing={4}>
        <Image systemName="water.waves" size={11} color="#ffffff" />
        <Text modifiers={[font({ size: 11, weight: "semibold" }), foregroundColor("#ffffff")]}>Olitas</Text>
        <Spacer />
        {medium ? (
          <Text modifiers={[font({ size: 10 }), foregroundColor("#ffffff"), opacity(0.6)]}>{props.updated}</Text>
        ) : null}
      </HStack>
      <Spacer />
      <Image systemName={props.symbol as never} size={medium ? 30 : 26} color="#ffffff" />
      <Text
        modifiers={[
          font({ size: medium ? 19 : 15, weight: "bold" }),
          foregroundColor("#ffffff"),
          lineLimit(2),
          minimumScaleFactor(0.8),
        ]}
      >
        {props.headline}
      </Text>
      <Text modifiers={[font({ size: 12, weight: "medium" }), foregroundColor("#ffffff"), opacity(0.9), lineLimit(1)]}>
        {props.detail}
      </Text>
      <Text modifiers={[font({ size: 11 }), foregroundColor("#ffffff"), opacity(0.7), lineLimit(1), minimumScaleFactor(0.8)]}>
        {props.spot}
      </Text>
    </VStack>
  );
};

export default createWidget<OlitasWidgetProps>("OlitasWidget", OlitasWidget, {
  spot: "Olitas",
  headline: "Abrí Olitas",
  detail: "para ver cómo está el mar",
  symbol: "water.waves",
  updated: "",
});
