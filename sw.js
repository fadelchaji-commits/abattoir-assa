// Service worker : fait fonctionner l'application hors connexion.
// IMPORTANT : changez le numero de version a chaque mise a jour du projet.
const VERSION = "abattoir-v1.3.0";

const FILES = [
  "./", "./index.html", "./manifest.json",
  "./style.css",
  "./logo-data.js", "./logic.js", "./printer.js", "./core.js",
  "./ticket.js", "./report.js", "./prices.js", "./logo.js",
  "./settings.js", "./main.js", "./pwa.js",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"
];

// Installation : on garde une copie de tous les fichiers
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Activation : on supprime les anciennes versions
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Requetes : internet d'abord (donc toujours la derniere version), sinon la copie locale
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
