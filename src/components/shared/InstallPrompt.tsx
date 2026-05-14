"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "vl-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user already dismissed
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Delay suggestion — show after user has been in the app a moment
      setTimeout(() => setVisible(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setVisible(false);
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Adicionar VivaLeve à tela inicial"
      className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] inset-x-0 z-40 flex justify-center px-5 pointer-events-none"
    >
      <div
        className="pointer-events-auto w-full max-w-sm bg-background border border-border/50 rounded-2xl px-5 py-4 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-400"
      >
        <p className="text-[13px] font-medium text-foreground/80 mb-0.5">
          Adicionar à tela inicial
        </p>
        <p className="text-[12px] text-muted-foreground/55 leading-relaxed mb-4">
          Acesse o VivaLeve diretamente, sem abrir o navegador.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-xl bg-foreground/[0.06] text-foreground/70 text-[13px] font-medium py-2.5 active:opacity-60 transition-opacity"
          >
            Adicionar
          </button>
          <button
            onClick={handleDismiss}
            className="text-[12px] text-muted-foreground/40 px-2 py-2.5 active:opacity-50 transition-opacity"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
