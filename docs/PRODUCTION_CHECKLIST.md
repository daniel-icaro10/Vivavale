# Checklist de Deploy — VivaLeve

## Variáveis de ambiente (obrigatórias)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chave anon pública do Supabase
- [ ] `NEXT_PUBLIC_SITE_URL` — URL pública do app (ex: `https://vivaleve.app`)

O app vai falhar imediatamente na inicialização se alguma das duas primeiras estiver ausente (`requireEnv()` lança erro explícito).

---

## Supabase

- [ ] Migrações aplicadas em produção (rodar SQL das migrations em ordem)
- [ ] Row Level Security habilitado em todas as tabelas
- [ ] Tabelas protegidas: `profiles`, `daily_logs`, `medications`, `reminders`, `notification_preferences`
- [ ] Auth providers configurados: Email/Password habilitado
- [ ] Site URL configurada: `https://seu-dominio.com`
- [ ] Redirect URL cadastrada: `https://seu-dominio.com/auth/callback`

---

## Deploy (Vercel ou similar)

- [ ] Variáveis de ambiente configuradas no painel do provedor
- [ ] Build command: `next build`
- [ ] Framework: Next.js detectado automaticamente
- [ ] Node.js >= 18.x

---

## Verificações pós-deploy

- [ ] Abrir o app em modo anônimo — deve redirecionar para `/login`
- [ ] Criar conta → confirmar email → fazer login → chegar no `/dashboard`
- [ ] Testar fluxo de recuperação de senha (email → `/update-password`)
- [ ] Registrar um sintoma diário
- [ ] Adicionar um medicamento
- [ ] Adicionar um lembrete
- [ ] Editar perfil (nome e fuso horário)
- [ ] Fazer logout e confirmar redirecionamento para `/login`
- [ ] Verificar que rotas protegidas redirecionam corretamente sem login

---

## Headers de segurança

Verificar com `curl -I https://seu-dominio.com`:

- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Strict-Transport-Security` presente
- [ ] `Content-Security-Policy` presente

---

## Performance

- [ ] Lighthouse score ≥ 80 em Performance, Accessibility, Best Practices
- [ ] Imagens com `alt` text (acessibilidade)
- [ ] Fontes carregadas com `display: swap`

---

## Mobile

- [ ] Testar iOS Safari (iPhone físico ou BrowserStack) — safe area, inputs sem zoom, bottom nav
- [ ] Testar Android Chrome — safe area, touch targets, scroll
- [ ] Verificar que nenhum input dispara zoom automático (font-size ≥ 16px em mobile)

---

## Monitoramento

- [ ] Verificar logs de erro no painel da Vercel após primeiros acessos (Functions tab)
- [ ] Confirmar que logger centralizado (`src/lib/logger.ts`) está capturando erros
- [ ] Plano de observabilidade documentado em `docs/OBSERVABILITY_PLAN.md`
- [ ] Para produção real: integrar Sentry ou Axiom (ver OBSERVABILITY_PLAN.md)
