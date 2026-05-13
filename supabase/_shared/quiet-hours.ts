/**
 * quiet-hours.ts — Shared Deno utility for send-reminders Edge Function.
 *
 * Determines whether a given UTC instant falls within the user's configured
 * quiet hours window, interpreted in their local timezone.
 *
 * Handles overnight ranges (e.g. 22:00 – 07:00) correctly.
 */

/**
 * Returns the local HH and MM of a UTC Date in the given IANA timezone.
 */
function localHM(utc: Date, timezone: string): { h: number; m: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(utc);
  return {
    h: parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10),
    m: parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10),
  };
}

/**
 * Converts "HH:MM" or "HH:MM:SS" to total minutes from midnight.
 */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Returns true if the given UTC instant falls within the user's quiet hours.
 *
 * @param startLocal - "HH:MM" or "HH:MM:SS" — start of quiet window (local time)
 * @param endLocal   - "HH:MM" or "HH:MM:SS" — end of quiet window (local time)
 * @param timezone   - IANA timezone identifier
 * @param now        - UTC Date to check (default: current time)
 */
export function isQuietHours(
  startLocal: string | null | undefined,
  endLocal: string | null | undefined,
  timezone: string,
  now: Date = new Date(),
): boolean {
  if (!startLocal || !endLocal) return false;

  try {
    const { h, m } = localHM(now, timezone);
    const currentMin = h * 60 + m;
    const startMin = toMinutes(startLocal);
    const endMin = toMinutes(endLocal);

    if (startMin <= endMin) {
      // Normal range: e.g. 08:00 – 20:00
      return currentMin >= startMin && currentMin < endMin;
    } else {
      // Overnight range: e.g. 22:00 – 07:00
      return currentMin >= startMin || currentMin < endMin;
    }
  } catch {
    return false;
  }
}
