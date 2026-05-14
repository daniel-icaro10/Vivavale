"use client";

import { useEffect } from "react";

// Detects low-end devices and sets html[data-performance="reduced"].
// Criteria: hardware concurrency ≤ 2 OR device memory ≤ 1 GB.
// CSS can then disable expensive animations/backdrops for these devices.
export function PerformanceProvider() {
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowCores  = (navigator.hardwareConcurrency ?? 4) <= 2;
    const lowMemory = (nav.deviceMemory ?? 4) <= 1;

    if (lowCores || lowMemory) {
      document.documentElement.setAttribute("data-performance", "reduced");
    }
  }, []);

  return null;
}
