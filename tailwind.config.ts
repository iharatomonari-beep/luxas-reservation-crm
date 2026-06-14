import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        luxas: {
          ink: "#25221f",
          line: "#ded8cf",
          paper: "#fbfaf7",
          mist: "#eef4f1",
          green: "#2f6f5e",
          gold: "#b9843f"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(37, 34, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
