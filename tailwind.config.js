/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily:
      {
        // Space Grotesk is loaded globally via <link> in index.html
        Grotesk: ["Space Grotesk", "sans-serif"]
      }
    },
  },
  plugins: [],
}

