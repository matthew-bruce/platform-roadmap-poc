import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rm: {
          red: "#DA202A",
          redDark: "#B10F1A",
          ink: "#141722",
          slate: "#657089",
          mist: "#EEF1F8",
          surface: "#FAFBFF"
        }
      },
      boxShadow: {
        soft: "0 10px 25px -12px rgba(20, 23, 34, 0.25)",
        glow: "0 0 0 1px rgba(218, 32, 42, 0.18), 0 16px 40px -22px rgba(218, 32, 42, 0.55)"
      }
    }
  },
  plugins: []
};

export default config;
