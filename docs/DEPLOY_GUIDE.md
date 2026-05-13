# Guia de Deploy — VivaLeve

## Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Projeto Supabase criado e migrations aplicadas
- Repositório no GitHub (ou GitLab/Bitbucket)

---

## 1. Configuração do Supabase

### 1.1 — Executar migrations

No SQL Editor do Supabase, executar cada arquivo de migration em ordem:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_schema_corrections.sql
supabase/migrations/003_reminders.sql
supabase/migrations/004_notifications.sql
```

### 1.2 — Configurar Auth URLs

Em **Authentication → URL Configuration**:

| Campo | Valor |
|---|---|
| Site URL | `https://seu-dominio.com` |
| Redirect URLs | `https://seu-dominio.com/auth/callback` |

> **Importante:** adicionar também `https://seu-dominio.vercel.app/auth/callback` se usar subdomínio da Vercel.

### 1.3 — Obter credenciais

Em **Project Settings → API**:
- `URL` → será `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Deploy na Vercel

### 2.1 — Importar repositório

1. Acessar [vercel.com/new](https://vercel.com/new)
2. Importar o repositório do GitHub
3. Framework detectado automaticamente: **Next.js**
4. Build command: `next build` (padrão)
5. Output directory: `.next` (padrão)

### 2.2 — Configurar variáveis de ambiente

Em **Settings → Environment Variables**, adicionar:

| Nome | Onde obter | Ambiente |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | URL de produção (ex: `https://vivaleve.app`) | **Production apenas** |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Gerada com `npx web-push generate-vapid-keys` | Production, Preview, Development |

> **Atenção:** `NEXT_PUBLIC_SITE_URL` é usado no link de recovery de senha. Em Preview não precisa ser definido — o fluxo de reset não funciona corretamente em ambientes Preview por design.

> **Sobre VAPID:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` é a chave pública (segura para expor). A chave privada (`VAPID_PRIVATE_KEY`) fica apenas nos segredos da Edge Function — nunca no app Next.js.

### 2.3 — Fazer o primeiro deploy

Clicar em **Deploy**. O build deve concluir em ~1-2 minutos.

---

## 3. Domínio customizado (opcional)

Em **Settings → Domains**:
1. Adicionar o domínio (ex: `vivaleve.app`)
2. Configurar os registros DNS indicados pela Vercel
3. Aguardar propagação (até 48h, geralmente < 1h)
4. Voltar ao Supabase e atualizar **Site URL** para o domínio final

---

## 4. Checklist pós-deploy

Execute todos os passos em modo anônimo (aba privada):

### Auth
- [ ] Acessar `https://seu-dominio.com` → redireciona para `/login`
- [ ] Criar conta → e-mail de confirmação chega
- [ ] Clicar no link do e-mail → redireciona para `/dashboard`
- [ ] Fazer logout → redireciona para `/login`
- [ ] Tentar acessar `/dashboard` sem login → redireciona para `/login`
- [ ] Solicitar recuperação de senha → e-mail chega
- [ ] Clicar no link → redireciona para `/update-password`
- [ ] Definir nova senha → redireciona para `/dashboard`

### Funcionalidades
- [ ] Adicionar medicamento
- [ ] Adicionar lembrete
- [ ] Fazer registro diário
- [ ] Editar perfil (nome e fuso horário)
- [ ] Visualizar histórico

### Notificações push
- [ ] Ativar notificações no perfil (Chrome Desktop/Android)
- [ ] Confirmar que subscription aparece em `push_subscriptions` no Supabase
- [ ] Invocar Edge Function manualmente: `supabase functions invoke send-reminders`
- [ ] Confirmar que notificação aparece no dispositivo
- [ ] Desativar notificações → subscription removida da tabela

### Mobile
- [ ] Testar no iOS Safari (iPhone físico ou BrowserStack)
- [ ] Testar no Android Chrome (físico ou BrowserStack)
- [ ] Confirmar que inputs não causam zoom
- [ ] Confirmar que a bottom nav não sobrepõe o home indicator

---

## 5. Troubleshooting comum

### "Variável de ambiente obrigatória não encontrada"
O app faz fail-fast se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem ausentes. Verificar as env vars no painel da Vercel e fazer redeploy.

### Loop de redirecionamento no login
Causas comuns:
1. `NEXT_PUBLIC_SITE_URL` apontando para URL errada
2. Redirect URL não cadastrada no Supabase
3. Cookie de sessão corrompido — limpar cookies do browser

### E-mail de confirmação não chega
- Verificar spam
- Em desenvolvimento, usar Supabase Inbucket (email local em `localhost:54324`)
- Em produção, o Supabase usa seu próprio SMTP — considerar configurar SMTP customizado em **Settings → Auth → SMTP Settings**

### Erro 500 após deploy
1. Verificar logs em **Vercel → Deployments → [deploy] → Functions**
2. Verificar se as migrations foram executadas no Supabase de produção
3. Confirmar que RLS está habilitado em todas as tabelas

---

## 6. Rollback

Na Vercel, qualquer deploy anterior pode ser promovido a produção instantaneamente:
1. **Deployments** → selecionar deploy anterior
2. **...** → **Promote to Production**

O rollback não afeta o banco de dados Supabase — migrations são irreversíveis por design.

---

## 7. Atualizações futuras

Cada push para `main` dispara um novo deploy automaticamente na Vercel.

Para mudanças que incluem migrations de banco:
1. Aplicar a migration no Supabase **antes** de fazer o deploy
2. Fazer o deploy do código
3. Verificar o checklist pós-deploy

> **Nunca faça deploy de código que depende de uma migration não aplicada.**
