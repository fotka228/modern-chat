/** @type {import('tailwindcss').Config} */
module.exports = {
  // Переконайтеся, що тут є всі ваші папки з компонентами та сторінками
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};