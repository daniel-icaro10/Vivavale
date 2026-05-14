// Offline queue v2 — localStorage-first com exponential backoff e stale cleanup.
// Design: invisível ao usuário. Sem UI de fila visível.

const QUEUE_KEY    = "vl-offline-queue";
const MAX_RETRIES  = 5;
const MAX_AGE_MS   = 24 * 60 * 60 * 1000; // 24 horas

export type QueuedActionType = "daily_log";

export interface QueuedAction {
  id:           string;
  type:         QueuedActionType;
  payload:      Record<string, unknown>;
  timestamp:    number;
  retries:      number;
  nextRetryAt:  number; // timestamp — não processar antes deste momento
}

// ── Persistência ─────────────────────────────────────────────

function readQueue(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedAction[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* storage cheio — falha silenciosa */ }
}

// ── API pública ───────────────────────────────────────────────

export function enqueue(
  type: QueuedActionType,
  payload: Record<string, unknown>,
): string {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const action: QueuedAction = {
    id,
    type,
    payload,
    timestamp:   Date.now(),
    retries:     0,
    nextRetryAt: 0, // pronto para tentar imediatamente
  };
  writeQueue([...readQueue(), action]);
  return id;
}

export function dequeue(id: string): void {
  writeQueue(readQueue().filter((a) => a.id !== id));
}

export function getQueue(): QueuedAction[] {
  return readQueue();
}

export function clearQueue(): void {
  if (typeof window !== "undefined") localStorage.removeItem(QUEUE_KEY);
}

export function hasQueue(): boolean {
  return readQueue().length > 0;
}

// Remove entradas mais antigas que MAX_AGE_MS — cleanup silencioso
export function cleanStaleQueue(): void {
  const now = Date.now();
  writeQueue(readQueue().filter((a) => now - a.timestamp < MAX_AGE_MS));
}

// Backoff exponencial: 2^retries segundos, máximo 30s
function backoffMs(retries: number): number {
  return Math.min(1000 * Math.pow(2, retries), 30_000);
}

// Replay das ações pendentes. syncFn retorna true se a ação foi bem-sucedida.
// Respeita nextRetryAt para não tentar antes do backoff.
export async function flushQueue(
  syncFn: (action: QueuedAction) => Promise<boolean>,
): Promise<void> {
  cleanStaleQueue(); // limpa antigas antes de processar

  const queue = readQueue();
  if (queue.length === 0) return;

  const now = Date.now();

  for (const action of queue) {
    if (action.nextRetryAt > now) continue; // ainda em backoff

    try {
      const ok = await syncFn(action);
      if (ok) {
        dequeue(action.id);
      } else {
        const newRetries = action.retries + 1;
        if (newRetries >= MAX_RETRIES) {
          dequeue(action.id); // descarta após MAX_RETRIES tentativas
        } else {
          writeQueue(
            readQueue().map((a) =>
              a.id === action.id
                ? { ...a, retries: newRetries, nextRetryAt: now + backoffMs(newRetries) }
                : a,
            ),
          );
        }
      }
    } catch {
      // Mantém na fila — será tentado no próximo flush
    }
  }
}
