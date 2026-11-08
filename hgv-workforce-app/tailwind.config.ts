import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hgv: {
          navy: {
            DEFAULT: "#202B46",
            light: "#2C3B5E",
            dark: "#161D30",
          },
          teal: {
            DEFAULT: "#00B0B9",
            light: "#14D0DB",
            dark: "#008A91",
          },
          sky: {
            DEFAULT: "#C5DBEF",
            light: "#E1EEFA",
            dark: "#9BBFD9",
          },
          yellow: {
            DEFAULT: "#FFECAE",
            light: "#FFF6D6",
            dark: "#E6CE8A",
          },
          coral: {
            DEFAULT: "#E73C3E",
            light: "#F06B6D",
            dark: "#BF2A2C",
          },
          sand: {
            DEFAULT: "#F5F1EB",
            light: "#FAF8F5",
            dark: "#E3DDD3",
          },
          gray: {
            DEFAULT: "#F1F1F1",
            light: "#F9F9F9",
            dark: "#D8D8D8",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Merriweather", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
