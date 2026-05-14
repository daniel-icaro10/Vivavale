// shouldSurfaceReflection v2 — adiciona cooldown e novelty à lógica base.
// Versão mais conservadora: fala menos, no momento certo.
// Note: o cooldown e novelty são client-only (localStorage).
// Em server components, use shouldSurfaceReflectionServer() que ignora cooldown.

import { shouldSurfaceReflection as baseShouldSurface } from "@/features/insights/reflection/shouldSurfaceReflection";
import { isInReflectionCooldown } from "./reflectionCooldown";
import type { CognitiveLoad } from "@/features/ux/cognitive/detectCognitiveLoad";

export interface RhythmReflectionInput {
  totalLogs: number;
  daysThisWeek: number;
  longitudinalState: string;
  daysSinceLastLog: number | null;
  cognitiveLoad: CognitiveLoad;
}

/**
 * Versão server-safe: usa apenas a lógica base sem cooldown (localStorage indisponível).
 * Usar em server components.
 */
export function shouldSurfaceReflectionServer(
  input: Omit<RhythmReflectionInput, "cognitiveLoad"> & { cognitiveLoad?: CognitiveLoad },
): boolean {
  const { cognitiveLoad = "calm", ...rest } = input;

  // Estados frágeis nunca recebem reflexões
  if (cognitiveLoad === "fragile" || cognitiveLoad === "recovering") return false;

  return baseShouldSurface(rest);
}

/**
 * Versão client: inclui cooldown e novelty check.
 * Chamar apenas de client components.
 */
export function shouldSurfaceReflectionClient(input: RhythmReflectionInput): boolean {
  if (!shouldSurfaceReflectionServer(input)) return false;
  if (isInReflectionCooldown()) return false;
  return true;
}
