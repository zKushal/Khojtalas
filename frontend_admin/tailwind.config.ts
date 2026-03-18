import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#0D0D0D",
        onyx: "#1A1A1A",
        cyan: "#00F2EA",
        magenta: "#FF0050",
        silver: "#A1A1A1",
      },
    },
  },
  plugins: [],
};

export default config;
