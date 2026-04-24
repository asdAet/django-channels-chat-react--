import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const customEmojiAssetPatterns = ["**/*.tgs", "**/*.webp", "**/*.webm"];
const DEFAULT_BACKEND_ORIGIN = "http://127.0.0.1:8000";

const normalizeOrigin = (
  value: string | undefined,
  defaultProtocol: "http" | "ws",
) => {
  const raw = String(value ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return null;

  const url = new URL(
    /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `${defaultProtocol}://${raw}`,
  );
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.origin;
};

const toWsOrigin = (httpOrigin: string) => {
  const url = new URL(httpOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enablePwa = String(env.VITE_ENABLE_PWA ?? "").trim() === "1";
  const backendOrigin =
    normalizeOrigin(env.VITE_BACKEND_ORIGIN, "http") ?? DEFAULT_BACKEND_ORIGIN;
  const backendWsOrigin =
    normalizeOrigin(env.VITE_WS_BACKEND_ORIGIN, "ws") ??
    toWsOrigin(backendOrigin);

  return {
    assetsInclude: customEmojiAssetPatterns,
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
          target: backendOrigin,
          changeOrigin: true,
        },
        "/ws": {
          target: backendWsOrigin,
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
