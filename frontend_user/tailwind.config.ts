import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
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
      boxShadow: {
        glow: "0 0 30px rgba(0, 242, 234, 0.25), 0 0 50px rgba(255, 0, 80, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
