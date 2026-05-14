"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getDayAtmosphere, getAtmosphereSupplement } from "../utils/getDayAtmosphere";
import type { DayAtmosphere } from "../utils/getDayAtmosphere";

// useSyncExternalStore: server snapshot → null (sem supplement no SSR).
// Client snapshot → hora local real. Evita hydration mismatch.
function useAtmosphere(): DayAtmosphere | null {
  return useSyncExternalStore(
    () => () => {},
    () => getDayAtmosphere(new Date().getHours()),
    () => null,
  );
}

// Ambient gradient — halo de luz primária quase invisível atrás do hero.
function getAmbientGradient(atmosphere: DayAtmosphere | null): string | undefined {
  if (!atmosphere || atmosphere === "night") return undefined;
  const opacity = atmosphere === "morning" ? "0.07" : "0.04";
  return `radial-gradient(ellipse 160% 120% at 0% 100%, oklch(0.540 0.138 277 / ${opacity}), transparent 60%)`;
}

interface AtmosphereHeroProps {
  contextMessage: string;
  dur: string;
  dateLabel: string;
  firstName: string | undefined;
  nextAction: string;
  hasLoggedToday: boolean;
}

export function AtmosphereHero({
  contextMessage,
  dur,
  dateLabel,
  firstName,
  nextAction,
  hasLoggedToday,
}: AtmosphereHeroProps) {
  const atmosphere = useAtmosphere();

  const supplement = atmosphere
    ? getAtmosphereSupplement(atmosphere, hasLoggedToday)
    : null;
  const isNight = atmosphere === "night";
  const effectiveDur = isNight ? "duration-300" : dur;
  const ambientBg = getAmbientGradient(atmosphere);

  return (
    <header
      className={`pb-8 animate-in fade-in-0 slide-in-from-bottom-1 ${effectiveDur}`}
      style={ambientBg ? { background: ambientBg } : undefined}
    >
      <p className="mb-2 vl-eyebrow">{dateLabel}</p>
      <h1
        className="text-[28px] font-semibold text-foreground"
        style={{ letterSpacing: "-0.030em", lineHeight: 1.1 }}
      >
        {firstName ? `Olá, ${firstName}` : "Olá"}
      </h1>
      <p
        className={`mt-3 text-[15px] leading-[1.85] max-w-xs transition-colors duration-500 ${
          isNight ? "text-muted-foreground/55" : "text-muted-foreground/75"
        }`}
        style={{ letterSpacing: "-0.004em" }}
      >
        {supplement ?? contextMessage}
      </p>
      {nextAction === "review_week" && (
        <Link
          href="/timeline"
          className="mt-3 inline-block py-1 text-xs text-muted-foreground/40 hover:text-primary transition-colors"
        >
          Ver sua semana →
        </Link>
      )}
    </header>
  );
}
