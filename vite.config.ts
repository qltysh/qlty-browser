import react from "@vitejs/plugin-react";
import { writeFile } from "fs/promises";
import { defineConfig } from "vite";

export default ({ mode }: { mode: string }) => {
  return defineConfig({
    plugins: [
      react(),
      {
        // Custom build step that processes the manifest.js file
        // as a Chrome Extension Manifest V3 JSON file, interpolating
        // any environment variables.
        name: "watch-manifest",
        async buildStart() {
          this.addWatchFile(`${__dirname}/manifest.js`);
        },
        async writeBundle() {
          const manifest = await import(`file://${__dirname}/manifest.js`);
          await writeFile(
            "dist/manifest.json",
            JSON.stringify(manifest.default, null, 2),
          );
        },
      },
    ],
    base: "./",
    build: {
      sourcemap: mode === "development",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          auth: "./src/auth.ts",
          coverage: "./src/coverage.ts",
          service_worker: "./src/service_worker.ts",
          settings: "./src/settings.html",
        },
        output: {
          entryFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
    resolve: {
      alias: {
        "~": `./src`,
      },
    },
  });
};
