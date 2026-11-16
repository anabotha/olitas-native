import Svg, { Circle, Path } from "react-native-svg";
import { Kayak } from "lucide-react-native";

type IconProps = { size?: number; color?: string; strokeWidth?: number };

// SUP: tabla con remo (lucide no tiene un ícono de SUP; el de kayak es el más parecido)
export const SupIcon = Kayak;

// Nadador de crol sobre una ola, con el mismo trazo que los íconos de lucide
export function SwimIcon({ size = 24, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="17.5" cy="9.5" r="2" />
      <Path d="M3 13.5l4.5-2.5 3 1.5 3-1.5" />
      <Path d="M10.5 12.5L13 6l4-1.5" />
      <Path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </Svg>
  );
}
