import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#06070a",
        panel: "#0c1220",
        panelSoft: "#121b2d",
        line: "#273247",
        accent: "#fb7185",
        accentWarm: "#fdba74",
        accentCool: "#67e8f9",
      },
      fontFamily: {
        body: ["var(--font-body)"],
        display: ["var(--font-display)"],
      },
      boxShadow: {
        glow: "0 20px 60px rgba(251, 113, 133, 0.15)",
        panel: "0 16px 40px rgba(0, 0, 0, 0.3)",
      },
      backgroundImage: {
        "dashboard-glow":
          "radial-gradient(circle at top, rgba(251,113,133,0.18), transparent 38%), radial-gradient(circle at 85% 15%, rgba(103,232,249,0.12), transparent 22%), linear-gradient(180deg, rgba(6,7,10,1) 0%, rgba(7,10,17,1) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
