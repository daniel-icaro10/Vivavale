// Haptics — @capacitor/haptics em plataformas nativas,
// navigator.vibrate como fallback web (fire-and-forget).

import { Capacitor } from "@capacitor/core";

type HapticStyle = "light" | "medium" | "heavy";

// Importação lazy do módulo nativo para evitar erros no browser
async function nativeImpact(style: "Light" | "Medium" | "Heavy") {
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle[style] });
}

async function nativeSelection() {
  const { Haptics } = await import("@capacitor/haptics");
  await Haptics.selectionStart();
}

async function nativeNotification(type: "Success" | "Warning" | "Error") {
  const { Haptics, NotificationType } = await import("@capacitor/haptics");
  await Haptics.notification({ type: NotificationType[type] });
}

function webVibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function isNative() {
  return Capacitor.isNativePlatform();
}

export const haptics = {
  lightImpact(): void {
    if (isNative()) { nativeImpact("Light").catch(() => null); return; }
    webVibrate(6);
  },

  mediumImpact(): void {
    if (isNative()) { nativeImpact("Medium").catch(() => null); return; }
    webVibrate(14);
  },

  heavyImpact(): void {
    if (isNative()) { nativeImpact("Heavy").catch(() => null); return; }
    webVibrate(28);
  },

  selection(): void {
    if (isNative()) { nativeSelection().catch(() => null); return; }
    webVibrate(3);
  },

  success(): void {
    if (isNative()) { nativeNotification("Success").catch(() => null); return; }
    webVibrate([8, 50, 8]);
  },

  warning(): void {
    if (isNative()) { nativeNotification("Warning").catch(() => null); return; }
    webVibrate([16, 40, 16]);
  },

  impact(style: HapticStyle = "light"): void {
    const map: Record<HapticStyle, () => void> = {
      light:  () => this.lightImpact(),
      medium: () => this.mediumImpact(),
      heavy:  () => this.heavyImpact(),
    };
    map[style]();
  },
};
