// Status bar adaptativa — sincroniza com o período do dia.
// Só atua em plataformas nativas (Capacitor). No browser, noop silencioso.

import { Capacitor } from "@capacitor/core";

export type AtmosphereTime = "morning" | "afternoon" | "evening" | "night";

// manhã e tarde → status bar escura (texto dark sobre fundo claro)
// noite e anoitecer → status bar clara (texto light sobre fundo mais escuro)
const STYLE_MAP: Record<AtmosphereTime, "Default" | "Dark" | "Light"> = {
  morning:   "Default",
  afternoon: "Default",
  evening:   "Light",
  night:     "Light",
};

const BG_MAP: Record<AtmosphereTime, string> = {
  morning:   "#faf9f6",
  afternoon: "#f9f8f6",
  evening:   "#f8f7f5",
  night:     "#f7f6f4",
};

export async function syncStatusBar(atmosphere: AtmosphereTime): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await Promise.all([
      StatusBar.setStyle({ style: Style[STYLE_MAP[atmosphere]] }),
      StatusBar.setBackgroundColor({ color: BG_MAP[atmosphere] }),
    ]);
  } catch {
    // Não fatal — continua sem status bar nativa
  }
}

export async function showStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.show();
  } catch { /* noop */ }
}

export async function hideStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.hide();
  } catch { /* noop */ }
}
