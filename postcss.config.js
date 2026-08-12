// Tailwind v4's @tailwindcss/postcss plugin compiles via Lightning CSS, which
// already applies vendor prefixes — autoprefixer would be a redundant second
// pass (and was removed accordingly).
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
