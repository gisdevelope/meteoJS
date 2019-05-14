const path = require("path");
const webpack = require("webpack");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: "production",
  entry: {
    "meteoJS": "./src/meteoJS/index.js",
    "meteoJS.min": "./src/meteoJS/index.js",
  },
  //devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "."),
    filename: "[name].js"
  },
  /*optimization: {
    minimize: true,
    minimizer: [new UglifyJsPlugin({
      include: /\.min\.js$/
    })]
  }*/
};