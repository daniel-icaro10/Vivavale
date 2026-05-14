"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface NativeSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Altura máxima como % do viewport. Default: 85 */
  maxHeightVh?: number;
}

export function NativeSheet({
  open,
  onClose,
  title,
  children,
  maxHeightVh = 85,
}: NativeSheetProps) {
  // Hydration guard — portal só existe no client
  const [mounted, setMounted]       = useState(false);
  const [visible, setVisible]       = useState(false);
  const [translateY, setTranslateY] = useState(100);
  const [dragging, setDragging]     = useState(false);
  const sheetRef  = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    // RAF torna async — evita cascata síncrona
    rafRef.current = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Animação de entrada/saída — usa RAF para não chamar setState síncrono
  useEffect(() => {
    if (open) {
      rafRef.current = requestAnimationFrame(() => {
        setVisible(true);
        // Segundo frame: dispara a transição CSS
        rafRef.current = requestAnimationFrame(() => setTranslateY(0));
      });
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      rafRef.current = requestAnimationFrame(() => setTranslateY(100));
      const t = setTimeout(() => setVisible(false), 440);
      return () => {
        cancelAnimationFrame(rafRef.current);
        clearTimeout(t);
      };
    }
  }, [open]);

  // Bloqueia scroll do body quando sheet está aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Keyboard: Escape fecha
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Drag handlers
  const onDragStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const onDragMove = useCallback((e: React.TouchEvent) => {
    const height = sheetRef.current?.offsetHeight ?? 400;
    const delta  = e.touches[0].clientY - startYRef.current;
    const pct    = Math.max(0, (delta / height) * 100);
    setTranslateY(pct);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragging(false);
    if (translateY > 30) {
      onClose();
    } else {
      setTranslateY(0); // spring back
    }
  }, [translateY, onClose]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "absolute inset-0 transition-opacity duration-400",
          open && translateY < 80 ? "opacity-100" : "opacity-0",
          "bg-foreground/10 backdrop-blur-[1.5px]",
        )}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-lg bg-card rounded-t-3xl",
          "pb-[calc(28px+env(safe-area-inset-bottom))]",
          "shadow-[0_-2px_32px_oklch(0_0_0/0.07),0_-1px_0_oklch(0_0_0/0.04)]",
          !dragging && "transition-transform duration-[440ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        )}
        style={{
          transform:  `translateY(${translateY}%)`,
          maxHeight:  `${maxHeightVh}dvh`,
          overflowY:  "auto",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 bg-card pt-3 pb-1 flex justify-center" aria-hidden="true">
          <div className="w-9 h-1 rounded-full bg-border/50" />
        </div>

        {title && (
          <div className="px-6 pt-3 pb-4 border-b border-border/40">
            <h2 className="text-[15px] font-semibold text-foreground/80 tracking-tight">
              {title}
            </h2>
          </div>
        )}

        <div className="px-6 pt-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
