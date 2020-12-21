module.exports = {
  purge: {
    content: [
      "./_site/**/*.html",
      "./_site/**/*.js",
      "./**/*.njk",
      "*.njk",
      "*/**/*.liquid",
    ],
    options: {
      safelist: {
        greedy: [/grid-cols-\d+$/],
      },
    },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      // header: ["Fira Sans", "Lucida Grande", "Tahoma", "sans-serif"],
      // header: ["Merriweather", "Impact", "serif"],
      header: ["Lato", "Lucida Grande", "Tahoma", "sans-serif"],
      // body: ["Lato", "Lucida Grande", "Tahoma", "sans-serif"],
      body: ["Cabin", "Lucida Grande", "Tahoma", "sans-serif"],
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
