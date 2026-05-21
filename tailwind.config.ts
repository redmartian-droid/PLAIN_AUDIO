import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      colors: {
        background: "#F8F8F8",
        foreground: "#0F0F0F",
        card: "#FFFFFF",
        "card-foreground": "#0F0F0F",
        primary: "#D63558",
        "primary-foreground": "#FFFFFF",
        secondary: "#E4E4E4",
        "secondary-foreground": "#0F0F0F",
        muted: "#C4C4C4",
        "muted-foreground": "#8A8A8A",
        accent: "#E8A020",
        "accent-foreground": "#FFFFFF",
        destructive: "#DC2626",
        "destructive-foreground": "#FFFFFF",
        border: "#E4E4E4",
        "border-dark": "#D0D0D0",
        input: "#E4E4E4",
        ring: "#E8A020",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0F0F0F",
          soft: "#3D3D3D",
        },
        mist: {
          DEFAULT: "#8A8A8A",
          light: "#C4C4C4",
        },
        amber: {
          DEFAULT: "#E8A020",
          light: "#FDF4E3",
          dark: "#C47A10",
        },
        success: "#1FAD75",
        warning: "#E6A817",
        error: "#DC2626",
        // Backward compatibility aliases
        terra: "#E8A020",
        "terra-light": "#FDF4E3",
        "terra-dark": "#C47A10",
        parchment: "#FFFFFF",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        soft: "0 4px 24px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        pulse: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
