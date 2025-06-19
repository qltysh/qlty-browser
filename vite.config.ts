import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { defineConfig } from "vite";

// @ts-ignore
import manifest from "./manifest";

const firefoxManifestArtifact = join(
  __dirname,
  "dist",
  "firefox",
  "manifest.json",
);

export default ({ mode }: { mode: string }) => {
  const targetBrowser = process.env.TARGET_BROWSER || "chrome";
  if (targetBrowser === "firefox") {
    delete manifest.background.service_worker;
    manifest.background.page = "./src/service_worker.html";
  }

  return defineConfig({
    plugins: [
      react(),
      crx({ manifest }),
      targetBrowser === "firefox" && {
        // Custom build step that processes the Firefox manifest.js file
        // to remove unused keys
        name: "update-firefox-manifest",
        async buildStart() {
          this.addWatchFile(`${__dirname}/manifest.js`);
        },
        async closeBundle() {
          const manifest = JSON.parse(
            await readFile(firefoxManifestArtifact, "utf-8"),
          );
          for (const resource of manifest.web_accessible_resources as {
            use_dynamic_url?: boolean;
          }[]) {
            delete resource.use_dynamic_url;
          }
          await writeFile(
            firefoxManifestArtifact,
            JSON.stringify(manifest, null, 2),
          );
        },
      },
    ],
    base: "./",
    build: {
      sourcemap: mode === "development",
      emptyOutDir: true,
      outDir: `dist/${targetBrowser}`,
      rollupOptions: {
        input: {
          auth: "./src/auth.ts",
          coverage: "./src/coverage.ts",
          service_worker:
            targetBrowser === "firefox"
              ? "./src/service_worker.html"
              : "./src/service_worker.ts",
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
