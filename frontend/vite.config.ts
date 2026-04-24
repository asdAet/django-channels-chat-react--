import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enablePwa = String(env.VITE_ENABLE_PWA ?? "").trim() === "1";

  return {
    assetsInclude: ["**/*.tgs"],
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
      ...(enablePwa
        ? [
            VitePWA({
              strategies: "injectManifest",
              srcDir: "src",
              filename: "sw.ts",
              injectRegister: null,
              registerType: "autoUpdate",
              devOptions: {
                enabled: false,
              },
              manifest: {
                name: "Devil",
                short_name: "Devil",
                start_url: "/",
                display: "standalone",
                background_color: "#0a1020",
                theme_color: "#0a1020",
                icons: [],
              },
            }),
          ]
        : []),
    ],

    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,

      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      },

      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/ws": {
          target: "ws://127.0.0.1:8000",
          ws: true,
          changeOrigin: true,
          secure: false,
          rewriteWsOrigin: true,
          configure: (proxy) => {
            proxy.on("error", (error) => {
              const code = (error as NodeJS.ErrnoException).code;
              if (
                code === "ECONNABORTED" ||
                code === "ECONNRESET" ||
                code === "EPIPE"
              ) {
                return;
              }
              console.error("[vite][ws-proxy] unexpected error", error);
            });
          },
        },
      },
    },
  };
});
