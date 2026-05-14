// App lifecycle — visibilitychange web + App events Capacitor + online recovery.
// Call initLifecycle() once from a client component. Cleans up on unmount.

import { Capacitor } from "@capacitor/core";

type LifecycleHandler = () => void;

const resumeHandlers: Set<LifecycleHandler> = new Set();
const pauseHandlers:  Set<LifecycleHandler> = new Set();
const onlineHandlers: Set<LifecycleHandler> = new Set();

export function onResume(handler: LifecycleHandler): () => void {
  resumeHandlers.add(handler);
  return () => resumeHandlers.delete(handler);
}

export function onPause(handler: LifecycleHandler): () => void {
  pauseHandlers.add(handler);
  return () => pauseHandlers.delete(handler);
}

// Registra handler para quando conexão retorna (online event)
export function onOnline(handler: LifecycleHandler): () => void {
  onlineHandlers.add(handler);
  return () => onlineHandlers.delete(handler);
}

function fireResume() { resumeHandlers.forEach((h) => h()); }
function firePause()  { pauseHandlers.forEach((h) => h()); }
function fireOnline() { onlineHandlers.forEach((h) => h()); }

let initialized = false;

export function initLifecycle(): () => void {
  if (initialized || typeof document === "undefined") return () => {};
  initialized = true;

  const cleanups: Array<() => void> = [];

  // ── Web: visibilitychange ───────────────────────────────
  let wasHidden = document.visibilityState === "hidden";

  const handleVisibility = () => {
    const nowHidden = document.visibilityState === "hidden";
    if (wasHidden && !nowHidden) fireResume();
    if (!wasHidden && nowHidden)  firePause();
    wasHidden = nowHidden;
  };

  document.addEventListener("visibilitychange", handleVisibility);
  cleanups.push(() => document.removeEventListener("visibilitychange", handleVisibility));

  // ── Web: online event — reconexão → flush queue + resume ─
  const handleOnline = () => {
    fireOnline();
    fireResume(); // reconectar = retomar
  };

  window.addEventListener("online", handleOnline);
  cleanups.push(() => window.removeEventListener("online", handleOnline));

  // ── Native: Capacitor App events ────────────────────────
  if (Capacitor.isNativePlatform()) {
    import("@capacitor/app").then(({ App }) => {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) fireResume();
        else          firePause();
      }).then((handle) => {
        cleanups.push(() => handle.remove());
      });

      // Splash screen — hide após primeira montagem do app
      import("@capacitor/splash-screen").then(({ SplashScreen }) => {
        SplashScreen.hide({ fadeOutDuration: 600 }).catch(() => null);
      }).catch(() => null);
    }).catch(() => null);
  }

  return () => {
    cleanups.forEach((fn) => fn());
    initialized = false;
  };
}
