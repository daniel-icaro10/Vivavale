"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "vl-install-dismissed";

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Chrome no iOS tem "CriOS", Firefox tem "FxiOS" — ambos não suportam Add to Home nativo
  const isSafariLike = !/CriOS|FxiOS/.test(ua);
  return isIOS && isSafariLike;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

// Ícone de compartilhar do iOS Safari (box com seta)
function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block align-[-2px] mx-0.5"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // iOS Safari — sem evento nativo, mostra instrução manual
    if (isIOSSafari()) {
      const t = setTimeout(() => setShowIOS(true), 5000);
      return () => clearTimeout(t);
    }

    // Android / Chrome / outros — evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowAndroid(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setShowAndroid(false);
    setShowIOS(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setShowAndroid(false);
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  // iOS — instruções manuais
  if (showIOS) {
    return (
      <div
        role="dialog"
        aria-label="Adicionar VivaLeve à tela inicial"
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] inset-x-0 z-40 flex justify-center px-5 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm bg-background border border-border/50 rounded-2xl px-5 py-4 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-400">
          <p className="text-[13px] font-medium text-foreground/80 mb-1">
            Adicionar à tela inicial
          </p>
          <p className="text-[12px] text-muted-foreground/60 leading-relaxed mb-4">
            Toque em <ShareIcon /> no Safari e depois em{" "}
            <span className="text-foreground/70 font-medium">&ldquo;Adicionar à Tela de Início&rdquo;</span>.
          </p>
          <button
            onClick={handleDismiss}
            className="text-[12px] text-muted-foreground/40 py-1 active:opacity-50 transition-opacity"
          >
            Entendi
          </button>
        </div>
      </div>
    );
  }

  // Android / Chrome — prompt nativo
  if (!showAndroid || !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Adicionar VivaLeve à tela inicial"
      className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] inset-x-0 z-40 flex justify-center px-5 pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-sm bg-background border border-border/50 rounded-2xl px-5 py-4 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-400">
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
