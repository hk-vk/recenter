const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");

module.exports = [
  {
    name: "javascript",
    entry: {
      index: "./src/index.tsx",
      background: "./src/background.ts",
      content: "./src/content.ts",
      superfocus: "./src/html/superfocus.ts",
      blocked: "./src/html/blocked.ts",
    },
    mode: "production",
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
                compilerOptions: { noEmit: false },
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          exclude: /node_modules/,
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: "file-loader",
              options: {
                context: "src/images",
                outputPath: "../images",
                name: "[path][name].[ext]",
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "manifest.json", to: "../manifest.json" },
          { from: "./src/data/", to: "../data" },
          {
            from: "./src/html/",
            to: "../html/",
            filter: (resourcePath) => {
              // Check if the file is HTML
              return (
                fs.statSync(resourcePath).isFile() &&
                resourcePath.endsWith(".html")
              );
            },
          },
        ],
      }),
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      path: path.join(__dirname, "dist/js"),
      filename: "[name].js",
    },
  },
  {
    name: "scss",
    entry: {
      superfocus: "./src/html/superfocus.scss",
    },
    mode: "production",
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
      ],
    },
    output: {
      path: path.join(__dirname, "dist/styles/"),
      filename: "[name].css",
    },
  },
  {
    name: "html",
    entry: {},
    plugins: [
      ...getHtmlPlugins(
        ["index", "index_2"],
        ["../js/index", "../js/index"],
        ["container", "container_2"]
      ),
    ],
    mode: "production",
    optimization: {
      minimize: false,
    },
    output: {
      path: path.join(__dirname, "dist/html/"),
      filename: "[name].html",
    },
  },
];
function getHtmlPlugins(name, chunks, divClass) {
  return chunks.map(
    (chunk, index) =>
      new HTMLPlugin({
        title: "React extension",
        filename: `${name[index]}.html`,
        chunks: [chunk],
        templateContent: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>React extension</title>
          </head>
          <body>
            <div class="${divClass[index]}">
              <!-- Your content here -->
            </div>
            <script src="${chunk}.js"></script>
          </body>
          </html>
        `,
      })
  );
}
