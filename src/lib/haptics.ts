// Haptics architecture — web noop with Capacitor-ready interface.
// When running under Capacitor: replace this module with the native
// @capacitor/haptics import by aliasing in capacitor.config.ts.

type HapticStyle = "light" | "medium" | "heavy";

function triggerVibration(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export const haptics = {
  lightImpact():  void { triggerVibration(8); },
  mediumImpact(): void { triggerVibration(18); },
  heavyImpact():  void { triggerVibration(30); },
  selection():    void { triggerVibration(4); },
  success():      void { triggerVibration([10, 60, 10]); },
  warning():      void { triggerVibration([20, 40, 20]); },
  impact(style: HapticStyle = "light"): void {
    const map: Record<HapticStyle, () => void> = {
      light:  this.lightImpact,
      medium: this.mediumImpact,
      heavy:  this.heavyImpact,
    };
    map[style].call(this);
  },
};
