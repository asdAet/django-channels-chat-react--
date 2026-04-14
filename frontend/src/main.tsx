import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Workbox } from "workbox-window";

import App from "./App";

const ENABLE_PWA = String(import.meta.env.VITE_ENABLE_PWA ?? "").trim() === "1";

const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const wb = new Workbox("/sw.js", { type: "module" });
    wb.register().catch(() => {});
  });
};

const unregisterServiceWorkers = () => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      )
      .catch(() => {});

    if (!("caches" in window)) return;

    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
      .catch(() => {});
  });
};

if (import.meta.env.PROD) {
  if (ENABLE_PWA) {
    registerServiceWorker();
  } else {
    unregisterServiceWorkers();
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
