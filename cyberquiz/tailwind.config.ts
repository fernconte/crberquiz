import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cyber-bg": "#0b0f14",
        "cyber-surface": "#121a24",
        "cyber-neon": "#39ff14",
        "cyber-cyan": "#00f0ff",
        "cyber-magenta": "#ff2bd6",
      },
      boxShadow: {
        neon: "0 0 20px rgba(57, 255, 20, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
