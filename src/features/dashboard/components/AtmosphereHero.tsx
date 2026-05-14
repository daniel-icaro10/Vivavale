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

  return (
    <header className={`pb-1 animate-in fade-in-0 slide-in-from-bottom-2 ${effectiveDur}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
        {dateLabel}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {firstName ? `Olá, ${firstName}` : "Olá"}
      </h1>
      <p
        className={`mt-1.5 text-sm leading-relaxed transition-colors duration-500 ${
          isNight ? "text-muted-foreground/60" : "text-muted-foreground"
        }`}
      >
        {supplement ?? contextMessage}
      </p>
      {nextAction === "review_week" && (
        <Link
          href="/timeline"
          className="mt-2 inline-block py-1 text-xs text-muted-foreground/55 hover:text-primary transition-colors"
        >
          Ver sua semana →
        </Link>
      )}
    </header>
  );
}
