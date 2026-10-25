/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        card: "#1c1c1e",
        border: "#2a2a2c",
        primary: "#0a84ff",
        accent: "#64d2ff",
        danger: "#ff453a",
        success: "#30d158",
        warning: "#ff9f0a",
        muted: "#8e8e93",
        placeholder: "#636366",
      },
    },
  },
  plugins: [],
};