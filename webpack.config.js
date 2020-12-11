const webpack = require("webpack");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const config = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "_site"),
    filename: "js/min.js",
  },
  devServer: {
    contentBase: path.join(__dirname, "_site"),
    compress: true,
    port: 9000,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          "postcss-loader",
        ],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: "css/[name].css" })],
};

module.exports = config;
