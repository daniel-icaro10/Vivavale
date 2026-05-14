"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { haptics } from "@/lib/haptics";

const THRESHOLD  = 68;  // px de pull para ativar
const MAX_PULL   = 110; // px máximo de resistência visual
const RESISTANCE = 0.45; // fator de resistência (quanto o glow cresce vs dedo)

export function AmbientPullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const wrapperRef      = useRef<HTMLDivElement>(null);
  const startYRef       = useRef(0);
  const pullingRef      = useRef(false);
  const [pull, setPull] = useState(0);           // 0–MAX_PULL px
  const [phase, setPhase] = useState<"idle" | "pulling" | "ready" | "refreshing">("idle");

  // Progresso 0..1 para interpolação visual
  const progress = Math.min(pull / THRESHOLD, 1);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 2) return; // não está no topo — ignora
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || window.scrollY > 2) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) { setPull(0); setPhase("idle"); return; }

    const clamped = Math.min(delta * RESISTANCE, MAX_PULL);
    setPull(clamped);

    if (clamped >= THRESHOLD && phase !== "ready") {
      setPhase("ready");
      haptics.selection();
    } else if (clamped < THRESHOLD && phase === "ready") {
      setPhase("pulling");
    } else if (clamped > 0 && phase === "idle") {
      setPhase("pulling");
    }
  }, [phase]);

  const onTouchEnd = useCallback(() => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (phase === "ready") {
      setPhase("refreshing");
      haptics.lightImpact();
      router.refresh();

      // Glow persiste brevemente, depois faz fade
      setTimeout(() => {
        setPhase("idle");
        setPull(0);
      }, 900);
    } else {
      setPhase("idle");
      setPull(0);
    }
  }, [phase, router]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: true });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  // Glow visual — radial gradient que emerge do topo
  const glowOpacity =
    phase === "idle"       ? 0 :
    phase === "pulling"    ? progress * 0.07 :
    phase === "ready"      ? 0.09 :
    /* refreshing */         0.06;

  const glowRadius =
    phase === "idle"       ? "40%" :
    phase === "ready"      ? "65%" :
    phase === "refreshing" ? "80%" :
    `${40 + progress * 25}%`;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Glow ambiental — absolutamente sutil */}
      {phase !== "idle" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 right-0 z-40"
          style={{
            height: "50vh",
            background: `radial-gradient(ellipse ${glowRadius} 40% at 50% -5%, oklch(0.540 0.128 277 / ${glowOpacity}) 0%, transparent 100%)`,
            transition: phase === "refreshing"
              ? "opacity 600ms ease, background 600ms ease"
              : "background 180ms ease",
          }}
        />
      )}
      {children}
    </div>
  );
}
