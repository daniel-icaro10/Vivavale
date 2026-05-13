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
} as const;
