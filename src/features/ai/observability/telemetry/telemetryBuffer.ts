import type { TelemetryEvent } from "../types/events";

const MAX_BUFFER = 500;

const buffer: TelemetryEvent[] = [];

export function pushToBuffer(event: TelemetryEvent): void {
  if (buffer.length >= MAX_BUFFER) buffer.shift();
  buffer.push(event);
}

export function drainBuffer(): TelemetryEvent[] {
  return buffer.splice(0, buffer.length);
}

export function getBufferSnapshot(): readonly TelemetryEvent[] {
  return buffer;
}
