// Offline queue — localStorage-first, sem IndexedDB.
// Salva ações quando offline, replay silencioso ao reconectar.

const QUEUE_KEY = "vl-offline-queue";

export type QueuedActionType = "daily_log";

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

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
  } catch { /* storage full — fail silently */ }
}

export function enqueue(type: QueuedActionType, payload: Record<string, unknown>): string {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const action: QueuedAction = { id, type, payload, timestamp: Date.now(), retries: 0 };
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

// Replay todas as ações pendentes. syncFn recebe o payload e retorna true se bem-sucedido.
export async function flushQueue(
  syncFn: (action: QueuedAction) => Promise<boolean>,
): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) return;

  for (const action of queue) {
    try {
      const ok = await syncFn(action);
      if (ok) {
        dequeue(action.id);
      } else {
        // Incrementa retry count — após 5 tentativas, descarta silenciosamente
        const updated = readQueue().map((a) =>
          a.id === action.id ? { ...a, retries: a.retries + 1 } : a,
        );
        writeQueue(updated.filter((a) => a.retries < 5));
      }
    } catch {
      // Mantém na fila para próxima tentativa
    }
  }
}
