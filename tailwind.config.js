/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { 
          DEFAULT: "#FF6B35",
          light: "#FF8C42", 
          dark: "#E85A2B" 
        },
        secondary: { 
          DEFAULT: "#14B8A6", 
          light: "#2DD4BF", 
          dark: "#0D9488" 
        },
        success: { DEFAULT: "#22C55E", muted: "rgba(34, 197, 94, 0.12)" },
        warning: { DEFAULT: "#F59E0B", muted: "rgba(245, 158, 11, 0.12)" },
        error: { DEFAULT: "#EF4444", muted: "rgba(239, 68, 68, 0.12)" },
        background: "#0A0A0B",
        card: "#141416",
        "card-elevated": "#1C1C1F",
        border: "#27272A",
        text: "#FAFAFA",
        "text-muted": "#A1A1AA",
        "text-subtle": "#71717A",
      },
    },
  },
  plugins: [],
};
