var path = require("path");
var HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  devtool: "inline-source-map",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js"
  },
  devServer: {
    contentBase: "./dist/"
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.ts$/,
        loader: "awesome-typescript-loader"
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js", ".json"]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "BubbleShooter VR",
      inject: "body",
      template: "./src/index.html"
    })
  ]
};
