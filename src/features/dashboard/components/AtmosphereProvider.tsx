"use client";

import { useEffect } from "react";
import { getDayAtmosphere } from "../utils/getDayAtmosphere";
import { syncStatusBar, type AtmosphereTime } from "@/lib/native/statusBar";
import { initLifecycle } from "@/lib/lifecycle";
import type { CognitiveLoad } from "@/features/ux/cognitive/detectCognitiveLoad";

export type UserPresence = "sparse" | "returning" | "steady" | "consistent";
export type JourneyState = "beginning" | "building" | "established" | "returning-deep";

// Injeta data-atmosphere, data-presence, data-journey e data-stimulation no <html>.
// Sincroniza status bar nativa com o período do dia.
// Inicializa lifecycle (visibilitychange + Capacitor App events).
export function AtmosphereProvider({
  presence = "steady",
  journey,
  cognitiveLoad,
}: {
  presence?: UserPresence;
  journey?: JourneyState;
  cognitiveLoad?: CognitiveLoad;
}) {
  useEffect(() => {
    const el = document.documentElement;
    const atmosphere = getDayAtmosphere(new Date().getHours()) as AtmosphereTime;

    el.dataset.atmosphere = atmosphere;

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

    // Reduz estimulação visual em estados frágeis / recovering
    if (cognitiveLoad === "fragile" || cognitiveLoad === "recovering") {
      el.dataset.stimulation = "low";
    } else {
      delete el.dataset.stimulation;
    }

    // Sincroniza status bar nativa com atmosfera
    syncStatusBar(atmosphere);

    // Inicializa lifecycle (splash hide + resume handlers + Capacitor App)
    const cleanupLifecycle = initLifecycle();

    return () => {
      delete el.dataset.atmosphere;
      delete el.dataset.presence;
      delete el.dataset.journey;
      delete el.dataset.stimulation;
      cleanupLifecycle();
    };
  }, [presence, journey, cognitiveLoad]);

  return null;
}
