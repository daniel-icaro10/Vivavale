"use client";

import { useEffect } from "react";
import { getDayAtmosphere } from "../utils/getDayAtmosphere";

export type UserPresence = "sparse" | "returning" | "steady" | "consistent";
export type JourneyState = "beginning" | "building" | "established" | "returning-deep";

// Injeta data-atmosphere, data-presence e data-journey no <html>.
// data-atmosphere → período do dia
// data-presence   → ritmo comportamental do usuário
// data-journey    → profundidade histórica da jornada
export function AtmosphereProvider({
  presence = "steady",
  journey,
}: {
  presence?: UserPresence;
  journey?: JourneyState;
}) {
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.atmosphere = getDayAtmosphere(new Date().getHours());

    if (presence !== "steady") {
      el.dataset.presence = presence;
    } else {
      delete el.dataset.presence;
    }

    if (journey) {
      el.dataset.journey = journey;
    } else {
      delete el.dataset.journey;
    }

    return () => {
      delete el.dataset.atmosphere;
      delete el.dataset.presence;
      delete el.dataset.journey;
    };
  }, [presence, journey]);

  return null;
}
