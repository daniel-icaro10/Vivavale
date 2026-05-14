// App lifecycle — handles visibility changes for silent background sync.
// Call initLifecycle() once from a client layout. Cleans up on unmount.

type LifecycleHandler = () => void;

const resumeHandlers: Set<LifecycleHandler> = new Set();

export function onResume(handler: LifecycleHandler): () => void {
  resumeHandlers.add(handler);
  return () => resumeHandlers.delete(handler);
}

let initialized = false;

export function initLifecycle(): () => void {
  if (initialized || typeof document === "undefined") return () => {};
  initialized = true;

  let hidden = document.visibilityState === "hidden";

  const handleVisibility = () => {
    const nowHidden = document.visibilityState === "hidden";
    if (hidden && !nowHidden) {
      // App resumed from background — notify all registered handlers
      resumeHandlers.forEach((h) => h());
    }
    hidden = nowHidden;
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    initialized = false;
  };
}
