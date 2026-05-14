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
// A intensidade varia por período do dia. À noite, ausência de luz.
function getAmbientGradient(atmosphere: DayAtmosphere | null): string | undefined {
  if (!atmosphere || atmosphere === "night") return undefined;
  const opacity = atmosphere === "morning" ? "0.06" : "0.04";
  return `radial-gradient(ellipse 130% 100% at 5% 100%, oklch(0.540 0.138 277 / ${opacity}), transparent 65%)`;
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
      className={`pb-3 animate-in fade-in-0 slide-in-from-bottom-2 ${effectiveDur}`}
      style={ambientBg ? { background: ambientBg } : undefined}
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.095em] text-muted-foreground/40">
        {dateLabel}
      </p>
      <h1
        className="text-2xl font-semibold text-foreground vl-hero-title"
        style={{ letterSpacing: "-0.028em", lineHeight: 1.15 }}
      >
        {firstName ? `Olá, ${firstName}` : "Olá"}
      </h1>
      <p
        className={`mt-2 text-[15px] leading-[1.75] transition-colors duration-500 ${
          isNight ? "text-muted-foreground/60" : "text-muted-foreground/80"
        }`}
        style={{ letterSpacing: "-0.004em" }}
      >
        {supplement ?? contextMessage}
      </p>
      {nextAction === "review_week" && (
        <Link
          href="/timeline"
          className="mt-2.5 inline-block py-1 text-xs text-muted-foreground/45 hover:text-primary transition-colors"
        >
          Ver sua semana →
        </Link>
      )}
    </header>
  );
}
