import { Platform, TextStyle } from "react-native";

const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

const monoFontFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const typography = {
  fontFamily,
  monoFontFamily,
  
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700",
    letterSpacing: -1,
  } as TextStyle,
  
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  } as TextStyle,
  
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
  } as TextStyle,
  
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  } as TextStyle,
  
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  } as TextStyle,
  
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  } as TextStyle,
  
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  } as TextStyle,
  
  captionMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  } as TextStyle,
  
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  } as TextStyle,
  
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  } as TextStyle,
  
  buttonSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  } as TextStyle,
} as const;





