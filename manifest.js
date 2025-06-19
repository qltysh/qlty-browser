export default {
  manifest_version: 3,
  name: "Qlty",
  version: "1.0",
  description: "Universal code quality tool",
  browser_specific_settings: {
    gecko: {
      id: "qlty@qlty.sh",
      strict_min_version: "110.0",
    },
  },
  permissions: ["activeTab", "storage"],
  action: {
    default_title: "Qlty Settings",
    default_popup: "src/settings.html",
  },
  content_scripts: [
    {
      matches: ["https://github.com/*/pull/*", "https://github.com/*/commit/*"],
      js: ["./src/coverage.ts"],
    },
    {
      matches: [
        `${process.env.VITE_LOGIN_URL ?? "https://qlty.sh"}/auth/browser?*`,
      ],
      js: ["./src/auth.ts"],
    },
  ],
  host_permissions: [`${process.env.VITE_API_URL ?? "https://api.qlty.sh"}/*`],
  background: {
    service_worker: "./src/service_worker.ts",
  },
  icons: {
    48: "icon48.png",
    128: "icon128.png",
  },
};
