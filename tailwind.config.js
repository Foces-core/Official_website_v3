/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily:
      {
        // Space Grotesk is self-hosted via @fontsource-variable
        Grotesk: ["Space Grotesk Variable", "sans-serif"]
      }
    },
  },
  plugins: [],
}

