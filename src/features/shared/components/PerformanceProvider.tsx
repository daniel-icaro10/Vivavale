"use client";

import { useEffect } from "react";

// Detecta dispositivos de baixa capacidade e aplica html[data-performance="reduced"].
// Critérios:
//   - hardwareConcurrency ≤ 2 (CPUs físicas)
//   - deviceMemory ≤ 1 GB
//   - Save-Data header ativado (conexão econômica)
// CSS desativa animações custosas, blur e gradientes nestes dispositivos.
export function PerformanceProvider() {
  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };

    const lowCores    = (navigator.hardwareConcurrency ?? 4) <= 2;
    const lowMemory   = (nav.deviceMemory ?? 4) <= 1;
    const saveData    = nav.connection?.saveData === true;
    const slowNetwork = nav.connection?.effectiveType === "2g" || nav.connection?.effectiveType === "slow-2g";

    if (lowCores || lowMemory || saveData || slowNetwork) {
      document.documentElement.setAttribute("data-performance", "reduced");
    }

    // Respeitar preferência do sistema também
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.setAttribute("data-performance", "reduced");
    }
  }, []);

  return null;
}
