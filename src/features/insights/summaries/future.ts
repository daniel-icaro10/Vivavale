/**
 * Stubs para futura integração com LLM (OpenAI / Anthropic Claude).
 *
 * GUARDRAILS obrigatórios quando implementado:
 *
 * 1. NUNCA afirmar diagnósticos — o modelo DEVE usar linguagem observacional
 *    ("pode estar relacionado", "padrão observado") e NUNCA ("você tem", "diagnóstico").
 *
 * 2. Anti-alucinação:
 *    - Passar apenas dados estruturados (scores + insights já computados), não texto livre do usuário.
 *    - Validar output do LLM contra lista de termos proibidos antes de exibir.
 *    - Definir temperatura baixa (≤ 0.3) para reprodutibilidade.
 *
 * 3. Segurança médica:
 *    - Incluir disclaimer fixo no final de QUALQUER saída gerada.
 *    - Se modelo detectar palavras de crise (suicídio, autolesão), substituir
 *      output por mensagem de suporte e número do CVV (188).
 *
 * 4. Prompt constraints:
 *    - System prompt em PT-BR, explícito sobre papel de wellness (não médico).
 *    - Max tokens: 300 para sumário, 150 por recomendação.
 *    - Banir emojis médicos (💊🩺🏥) do output.
 *
 * 5. Custo / latência:
 *    - Usar cache semântico (Redis) por hash dos scores para evitar chamadas repetidas.
 *    - Fallback para engine determinística se LLM estiver indisponível.
 */

import type { InsightsResult, ComputedInsights } from "../types";

/**
 * Futuramente: gera um sumário em linguagem natural a partir dos scores.
 * Por enquanto retorna null — o engine determinístico cobre esse caso.
 */
export async function futureGenerateInsightSummary(
  _result: InsightsResult,
): Promise<string | null> {
  // TODO: integrar OpenAI/Claude aqui com os guardrails acima
  return null;
}

/**
 * Futuramente: gera um resumo semanal personalizado para usuários cadastrados.
 * Recebe histórico de sessões e retorna texto motivacional + observacional.
 */
export async function futureGenerateWeeklySummary(
  _sessions: InsightsResult[],
): Promise<ComputedInsights | null> {
  // TODO: integrar com histórico do usuário autenticado
  return null;
}
