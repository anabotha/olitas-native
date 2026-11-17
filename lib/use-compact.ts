import { useWindowDimensions } from "react-native";

/**
 * Pantalla chica o letra del sistema agrandada (ej. un A33 con fuente grande).
 * Usa el ancho "efectivo": con fontScale alto entra menos texto aunque el celu sea ancho.
 */
export function useCompact() {
  const { width, fontScale } = useWindowDimensions();
  return width / fontScale < 400;
}
