// Service worker: viser siden fra lokal lagring med en gang,
// og henter ny versjon fra GitHub i bakgrunnen (gjelder fra neste åpning).
const CACHE = "sok-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.add("./")).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Bare egne GET-forespørsler; Startpage, YouTube osv. røres ikke
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(caches.open(CACHE).then(async (c) => {
    const key = req.mode === "navigate" ? "./" : req;
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req)
      .then((res) => {
        if (res.ok && !res.redirected && res.type === "basic") c.put(key, res.clone());
        return res;
      })
      .catch(() => hit || Response.error());
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  }));
});
