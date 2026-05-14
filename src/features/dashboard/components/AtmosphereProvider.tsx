"use client";

import { useEffect } from "react";
import { getDayAtmosphere } from "../utils/getDayAtmosphere";

export type UserPresence = "sparse" | "returning" | "steady" | "consistent";

// Injeta data-atmosphere e data-presence no <html>.
// data-atmosphere responde ao período do dia (temporal).
// data-presence responde ao ritmo do usuário (comportamental).
export function AtmosphereProvider({ presence = "steady" }: { presence?: UserPresence }) {
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.atmosphere = getDayAtmosphere(new Date().getHours());
    if (presence !== "steady") {
      el.dataset.presence = presence;
    } else {
      delete el.dataset.presence;
    }
    return () => {
      delete el.dataset.atmosphere;
      delete el.dataset.presence;
    };
  }, [presence]);

  return null;
}
