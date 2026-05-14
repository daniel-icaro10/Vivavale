// Mapeia CognitiveLoad para decisões de complexidade da interface.
// Cada campo é uma decisão binária ou escalar que o dashboard e componentes usam.

import type { CognitiveLoad } from "./detectCognitiveLoad";

export interface InterfaceComplexity {
  /** Exibir InsightsStrip (streak, métricas resumidas). */
  showInsightsStrip: boolean;
  /** Exibir ecos longitudinais (MemoryEcho/MemoryThread). */
  showEchoes: boolean;
  /** Exibir RecentActivity. */
  showRecentActivity: boolean;
  /** Permitir reflexões e discoveries. */
  showReflections: boolean;
  /** Nível de motion: full | reduced | minimal */
  motionLevel: "full" | "reduced" | "minimal";
  /** Opacidade máxima de elementos de apoio (ecos, insights secundários). */
  supportOpacity: number;
}

const COMPLEXITY_MAP: Record<CognitiveLoad, InterfaceComplexity> = {
  calm: {
    showInsightsStrip:  true,
    showEchoes:         true,
    showRecentActivity: true,
    showReflections:    true,
    motionLevel:        "full",
    supportOpacity:     1,
  },
  reduced: {
    showInsightsStrip:  true,
    showEchoes:         true,
    showRecentActivity: false,
    showReflections:    true,
    motionLevel:        "reduced",
    supportOpacity:     0.75,
  },
  fragile: {
    showInsightsStrip:  false,
    showEchoes:         false,
    showRecentActivity: false,
    showReflections:    false,
    motionLevel:        "minimal",
    supportOpacity:     0.50,
  },
  recovering: {
    showInsightsStrip:  false,
    showEchoes:         false,
    showRecentActivity: false,
    showReflections:    false,
    motionLevel:        "minimal",
    supportOpacity:     0.55,
  },
};

export function getInterfaceComplexity(load: CognitiveLoad): InterfaceComplexity {
  return COMPLEXITY_MAP[load];
}
