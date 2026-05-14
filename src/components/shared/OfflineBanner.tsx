"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (isOffline) {
        setVisible(true);
      } else {
        // Delay hide so user sees "voltou" state briefly
        const t = setTimeout(() => setVisible(false), 2200);
        return () => clearTimeout(t);
      }
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div
        className={[
          "mt-2 mx-4 px-4 py-2 rounded-full text-[12px] leading-none transition-all duration-500",
          "bg-background/90 backdrop-blur-sm border border-border/40",
          "text-muted-foreground/60 shadow-sm",
          offline ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
        ].join(" ")}
      >
        {offline ? "Sem conexão" : "Conexão restaurada"}
      </div>
    </div>
  );
}
