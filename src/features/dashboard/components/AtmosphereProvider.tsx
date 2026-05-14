"use client";

import { useEffect } from "react";
import { getDayAtmosphere } from "../utils/getDayAtmosphere";

// Injeta data-atmosphere no <html> para que o CSS responda
// ao período do dia com mudanças sutis de cor e contraste.
// Roda apenas no cliente — sem hidration mismatch.
export function AtmosphereProvider() {
  useEffect(() => {
    const atmosphere = getDayAtmosphere(new Date().getHours());
    document.documentElement.dataset.atmosphere = atmosphere;
    return () => {
      delete document.documentElement.dataset.atmosphere;
    };
  }, []);

  return null;
}
