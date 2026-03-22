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
        ink: "#0f172a",
        panel: "#14213d",
        panelSoft: "#1d2d50",
        line: "#6b8fb8",
        accent: "#fb7185",
        accentWarm: "#fb923c",
        accentCool: "#22d3ee",
      },
      fontFamily: {
        body: ["var(--font-body)"],
        display: ["var(--font-display)"],
      },
      boxShadow: {
        glow: "0 18px 45px rgba(34, 211, 238, 0.18)",
        panel: "0 18px 45px rgba(15, 23, 42, 0.18)",
      },
      backgroundImage: {
        "dashboard-glow":
          "radial-gradient(circle at 12% 12%, rgba(34,211,238,0.18), transparent 24%), radial-gradient(circle at 88% 10%, rgba(251,146,60,0.18), transparent 24%), linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 52%, rgba(51,65,85,1) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
