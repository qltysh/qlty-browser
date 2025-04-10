import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default ({ mode }: { mode: string }) => {
  return defineConfig({
    plugins: [react()],
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
