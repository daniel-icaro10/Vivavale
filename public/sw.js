// VivaLeve — Service Worker v2
// Estratégias de cache:
//   Cache-first   → assets estáticos (JS, CSS, fonts, ícones)
//   SWR           → páginas do app (dashboard, timeline, etc.)
//   Network-first → API routes, auth, mutations
//   Offline page  → fallback quando navegação falha sem cache

const CACHE_VERSION = "vl-v2";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_PRECACHE = [
  "/offline.html",
  "/manifest.json",
  "/icon.svg",
];

const CACHE_FIRST_PATTERNS = [
  /\/_next\/static\//,
  /\/fonts\//,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
  /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/,
];

const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /\/auth\//,
];

// App routes — kept for reference / future precache expansion
// const APP_ROUTES = ["/dashboard", "/timeline", "/daily", "/history", "/medications", "/reminders", "/profile"];

// ── Install — pré-cache de assets críticos ──────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_PRECACHE).catch(() => {
        // Falha silenciosa — arquivos podem não existir ainda
      }),
    ),
  );
  self.skipWaiting();
});

// ── Activate — limpa caches de versões antigas ──────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => clients.claim()),
  );
});

// ── Fetch — roteamento de estratégias ──────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET e extensões de browser
  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  // Cache-first: assets estáticos
  if (CACHE_FIRST_PATTERNS.some((p) => p.test(request.url))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Network-first: API e auth
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(request.url))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // SWR: navegação em páginas do app
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }
});

// ── Estratégias ─────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Serve cache imediatamente, atualiza em background
    fetchPromise.catch(() => null);
    return cached;
  }

  // Sem cache — aguarda rede ou serve página offline
  const fresh = await fetchPromise;
  if (fresh) return fresh;

  // Fallback offline
  const offlinePage = await caches.match("/offline.html");
  return offlinePage ?? new Response("Offline", { status: 503 });
}

// ── Push notifications (preservado) ────────────────────────
const APP_ORIGIN = self.location.origin;

self.addEventListener("push", (event) => {
  let payload = {
    title: "VivaLeve",
    body: "Lembrete gentil: horário do seu remédio.",
    reminderId: null,
    medicationName: null,
  };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch { /* usa defaults */ }

  const title = payload.title ?? "VivaLeve";
  const body = payload.medicationName
    ? `Hora de tomar: ${payload.medicationName}`
    : payload.body;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon-monochrome.svg",
      tag: payload.reminderId ? `reminder-${payload.reminderId}` : "reminder",
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [100, 50, 100],
      data: { url: "/reminders", reminderId: payload.reminderId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = `${APP_ORIGIN}${event.notification.data?.url ?? "/reminders"}`;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      }),
  );
});
