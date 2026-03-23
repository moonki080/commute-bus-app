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
        glow: "0 10px 24px rgba(15, 23, 42, 0.16)",
        panel: "0 10px 24px rgba(15, 23, 42, 0.22)",
      },
      backgroundImage: {
        "dashboard-glow":
          "radial-gradient(circle at top, rgba(148,163,184,0.14), transparent 26%), linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
