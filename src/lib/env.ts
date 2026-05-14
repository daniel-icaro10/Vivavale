// Validação de variáveis de ambiente em tempo de inicialização.
// Qualquer variável ausente gera um erro explícito antes do primeiro request.
// Isso evita crashes silenciosos ou erros difíceis de rastrear em produção.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[VivaLeve] Variável de ambiente obrigatória não encontrada: "${name}". ` +
        `Verifique o arquivo .env.local e as configurações do ambiente de produção.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  // Opcional — tem fallback seguro para desenvolvimento local
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // IA narrativa — opcional. Se AI_NARRATIVES_ENABLED != "true", o sistema usa
  // fallback determinístico e ANTHROPIC_API_KEY não é carregada.
  aiEnabled: process.env.AI_NARRATIVES_ENABLED === "true",
  // Nunca exposto ao cliente. Apenas server-side.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? null,
  // Modelo Claude — padrão: haiku (rápido e barato para narrativas curtas).
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",

  // Service role key — nunca exposta ao cliente. Apenas server-side para admin ops.
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? null,

  // VAPID public key — seguro expor no cliente (pública por design do protocolo).
  // Usada em push.ts para assinar a subscription do browser.
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
} as const;
