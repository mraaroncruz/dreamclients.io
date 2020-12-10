module.exports = {
  purge: [
    "./_site/**/*.html",
    "./_site/**/*.js",
    "*/**/*.njk",
    "*/**/*.liquid",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
