/* =========================================================
   WM TAPPER
   Service Worker
   ========================================================= */

const CACHE_NAME = "wm-tapper-v2";

const ASSETS = [
    "./",
    "./index.html",
    "./manifest.webmanifest",

    "./src/css/main.css",

    "./js/app.js",
    "./js/analyzer.js",
    "./js/analysis-worker.js",
    "./js/dropdowns.js",
    "./js/i18n.js",
    "./js/key-handler.js",
    "./js/language-ui.js",
    "./js/session.js",
    "./js/settings.js",
    "./js/storage.js",
    "./js/tap-engine.js",
    "./js/tap-ui.js",
    "./js/waveform.js",

    "./lib/essentia/essentia.js-core.es.js",
    "./lib/essentia/essentia-wasm.web.js",
    "./lib/essentia/essentia-wasm.web.wasm",

    "./assets/fonts/Finlandica-VariableFont_wght.ttf",

    "./assets/icons/donate.svg",
    "./assets/icons/settings.svg",
    "./assets/icons/wm-tapper-icon-192.png",
    "./assets/icons/wm-tapper-icon-512.png",
    "./assets/icons/wm-tapper-icon-180-apple.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }),
    );

    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key)),
            );
        }),
    );

    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(event.request)
                .then((response) => {
                    return response;
                })
                .catch(() => {
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }

                    return Response.error();
                });
        }),
    );
});
