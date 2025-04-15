export default {
  manifest_version: 3,
  name: "Qlty",
  version: "1.0",
  description: "Universal code quality tool",
  permissions: ["activeTab", "storage"],
  action: {
    default_title: "Qlty Settings",
    default_popup: "src/settings.html",
  },
  content_scripts: [
    {
      matches: ["https://github.com/*/pull/*", "https://github.com/*/commit/*"],
      css: ["coverage.css"],
      js: ["coverage.js"],
    },
    {
      matches: [
        `${process.env.VITE_LOGIN_URL ?? "https://qlty.sh"}/auth/browser?*`,
      ],
      js: ["auth.js"],
    },
  ],
  host_permissions: [`${process.env.VITE_API_URL ?? "https://api.qlty.sh"}/*`],
  background: {
    service_worker: "service_worker.js",
  },
  icons: {
    48: "icon48.png",
    128: "icon128.png",
  },
};
