// VivaLeve — Service Worker
// Responsabilidades:
//   1. Receber push notifications da Edge Function
//   2. Exibir notificação suave ao usuário
//   3. Navegar para /reminders ao clicar
//
// Este arquivo é servido como asset estático em /sw.js.
// O escopo padrão é "/" — controla todo o app.

const APP_ORIGIN = self.location.origin;

// ============================================================
// Push event — recebe payload e exibe notificação
// ============================================================

self.addEventListener("push", (event) => {
  let payload = {
    title: "VivaLeve",
    body: "Lembrete gentil: horário do seu remédio.",
    reminderId: null,
    medicationName: null,
  };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    // payload inválido — usa defaults acima
  }

  const title = payload.title ?? "VivaLeve";
  const body = payload.medicationName
    ? `Hora de tomar: ${payload.medicationName}`
    : payload.body;

  const options = {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    // tag agrupa notificações do mesmo lembrete — evita duplicatas no painel
    tag: payload.reminderId ? `reminder-${payload.reminderId}` : "reminder",
    // renotify: exibe mesmo se já existe uma com o mesmo tag
    renotify: true,
    // requireInteraction: false — não persiste a notificação (menos intrusivo)
    requireInteraction: false,
    // silent: false — toca o som padrão do sistema
    silent: false,
    // vibrate: padrão suave
    vibrate: [100, 50, 100],
    data: {
      url: "/reminders",
      reminderId: payload.reminderId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================================
// Notification click — abre ou foca o app
// ============================================================

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/reminders";
  const fullUrl = `${APP_ORIGIN}${targetUrl}`;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Se o app já está aberto em alguma aba, foca e navega
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        // Não há aba aberta — abre uma nova
        return clients.openWindow(fullUrl);
      }),
  );
});

// ============================================================
// Install + Activate — garante atualização imediata do SW
// ============================================================

self.addEventListener("install", () => {
  // skipWaiting: o novo SW assume imediatamente sem esperar abas antigas fecharem
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // clients.claim: assume controle das abas abertas imediatamente
  event.waitUntil(clients.claim());
});
