/**
 * push.ts — Utilitários client-side para Web Push API.
 *
 * VAPID Public Key: seguro para expor no cliente (é pública por design do protocolo).
 * VAPID Private Key: NUNCA no cliente — fica em Supabase Edge Function secrets.
 *
 * Variável de ambiente necessária:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — chave pública VAPID (base64url sem padding)
 *
 * Como gerar as chaves VAPID:
 *   npx web-push generate-vapid-keys
 *   ou: node -e "require('web-push').generateVAPIDKeys()" | node
 */

/**
 * Converte uma string base64url (sem padding) para Uint8Array.
 * Necessário para a API pushManager.subscribe({ applicationServerKey }).
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  // Adiciona padding se necessário
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

/**
 * Verifica se o ambiente suporta Web Push Notifications.
 *
 * Limitações conhecidas:
 *   - iOS Safari: apenas em PWAs instaladas (iOS 16.4+). Safari em aba normal: NÃO suporta.
 *   - Firefox Android: suporte completo.
 *   - Chrome Android: suporte completo.
 *   - Chrome Desktop: suporte completo.
 *   - Safari Desktop (macOS 13+): suporte em PWAs instaladas.
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Retorna o status atual da permissão de notificações.
 * "default" = nunca pedido, "granted" = concedida, "denied" = bloqueada.
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Retorna a PushSubscription ativa do service worker, ou null se não houver.
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Solicita permissão e cria uma nova PushSubscription.
 * Lança erro se a permissão for negada ou se a VAPID key não estiver configurada.
 */
export async function subscribeToPush(): Promise<PushSubscription> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("permission-denied");
  }

  const reg = await navigator.serviceWorker.ready;
  return await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
}

/**
 * Remove a PushSubscription ativa do browser e retorna true se bem-sucedido.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getExistingSubscription();
  if (!sub) return true;
  return sub.unsubscribe();
}
