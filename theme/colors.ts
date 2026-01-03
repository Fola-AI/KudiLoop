export const colors = {
  // Brand colors - Updated to KudiLoop Orange
  primary: { 
    DEFAULT: "#FF6B35",  // KudiLoop Orange
    light: "#FF8C42", 
    dark: "#E85A2B" 
  },
  secondary: { 
    DEFAULT: "#14B8A6", 
    light: "#2DD4BF", 
    dark: "#0D9488" 
  },
  success: { 
    DEFAULT: "#22C55E", 
    light: "#4ADE80", 
    dark: "#16A34A", 
    muted: "rgba(34, 197, 94, 0.12)" 
  },
  warning: { 
    DEFAULT: "#F59E0B", 
    light: "#FBBF24", 
    dark: "#D97706", 
    muted: "rgba(245, 158, 11, 0.12)" 
  },
  error: { 
    DEFAULT: "#EF4444", 
    light: "#F87171", 
    dark: "#DC2626", 
    muted: "rgba(239, 68, 68, 0.12)" 
  },
  background: "#0A0A0B",
  card: "#141416",
  cardElevated: "#1C1C1F",
  border: "#27272A",
  text: "#FAFAFA",
  textMuted: "#A1A1AA",
  textSubtle: "#71717A",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  currency: {
    NGN: "#22C55E",
    GBP: "#6366F1", 
    USD: "#14B8A6",
    EUR: "#F59E0B",
    CAD: "#EF4444",
  },
} as const;

export type ColorKeys = keyof typeof colors;
