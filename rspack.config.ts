import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import { resolve } from "path";

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ["chrome >= 87", "edge >= 88", "firefox >= 78", "safari >= 14"];

export default defineConfig({
  entry: {
    auth: "./src/auth.ts",
    coverage: "./src/coverage.ts",
    service_worker: "./src/service_worker.ts",
    settings: "./src/settings.ts",
  },
  output: {
    cssFilename: "styles.css",
  },
  resolve: {
    extensions: ["...", ".ts"],
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: "asset",
      },
      {
        test: /\.js$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "ecmascript",
                },
              },
              env: { targets },
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                },
              },
              env: { targets },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new rspack.CopyRspackPlugin({
      patterns: [{ from: "./src/settings.html" }],
    }),
  ],
  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
  },
  experiments: {
    css: true,
  },
});
