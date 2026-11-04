import { useColorScheme } from "react-native";

// Valores equivalentes (en hex) a los tokens oklch de la versión web
const light = {
  background: "#eef4f6",
  foreground: "#162a33",
  card: "#fbfdfd",
  primary: "#2f7fa3",
  primaryForeground: "#f2fafb",
  secondary: "#e4f0ef",
  secondaryForeground: "#26404b",
  muted: "#e8f1f1",
  mutedForeground: "#4a6570",
  accent: "#3dc9a9",
  destructive: "#dc2626",
  border: "#d4e6e9",
  chrome: "#e8f1f1",
  chromeBorder: "#d3dadd",
  highlight: "#e8f2f8",
  highlightBorder: "#7fb1d1",
  warning: "#f5a524",
  warningForeground: "#8a5a0b",
};

const dark: typeof light = {
  background: "#0f1a1f",
  foreground: "#e3ecee",
  card: "#16252b",
  primary: "#4aa6bf",
  primaryForeground: "#0b1519",
  secondary: "#1f323a",
  secondaryForeground: "#dbe7ea",
  muted: "#1f323a",
  mutedForeground: "#8fa8b0",
  accent: "#3dc9a9",
  destructive: "#f87171",
  border: "#22363e",
  chrome: "#16252b",
  chromeBorder: "#22363e",
  highlight: "#193543",
  highlightBorder: "#3d7894",
  warning: "#f5a524",
  warningForeground: "#f7c46c",
};

export type Colors = typeof light;

export function useIsDark() {
  return useColorScheme() === "dark";
}

export function useTheme(): Colors {
  return useIsDark() ? dark : light;
}

// Escala de puntaje 0–10 (misma que usaban las cards de actividad)
const SCORE_BG = [
  ["#fef2f2", "#450a0a4d"],
  ["#fffbeb", "#4520064d"],
  ["#ecfdf5", "#022c224d"],
  ["#f0fdfa", "#042f2e4d"],
  ["#ecfeff", "#0833444d"],
];
const SCORE_TEXT = [
  ["#b91c1c", "#f87171"],
  ["#92400e", "#fbbf24"],
  ["#047857", "#34d399"],
  ["#0f766e", "#2dd4bf"],
  ["#0e7490", "#22d3ee"],
];
const SCORE_SEGMENT = ["#f87171", "#fbbf24", "#10b981", "#14b8a6", "#06b6d4"];
const SCORE_DOT = ["#ef4444", "#f59e0b", "#10b981", "#14b8a6", "#06b6d4"];

export function getScoreStyle(score: number, isDark: boolean) {
  const tier = score <= 1 ? 0 : score <= 5 ? 1 : score <= 7 ? 2 : score <= 9 ? 3 : 4;
  const i = isDark ? 1 : 0;
  return {
    bg: SCORE_BG[tier][i],
    text: SCORE_TEXT[tier][i],
    segment: SCORE_SEGMENT[tier],
    dot: SCORE_DOT[tier],
  };
}
