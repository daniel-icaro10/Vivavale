# VivaLeve

Aplicativo de acompanhamento para pessoas com fibromialgia e dores crônicas.

O VivaLeve ajuda pacientes a registrar seus sintomas diariamente, acompanhar medicamentos e manter lembretes de horários — tudo em um único lugar, pensado para uso em celular.

---

## Funcionalidades

### Registro diário de sintomas
Registre como você está se sentindo todos os dias com escalas de 0 a 10 para:
- Nível de dor
- Fadiga
- Qualidade do sono
- Humor
- Ansiedade

Adicione anotações livres para complementar o registro.

### Histórico
Visualize seus registros dos últimos 30 dias agrupados por mês, com resumo dos níveis de cada sintoma.

### Medicamentos
Cadastre seus medicamentos, marque como ativos ou inativos e edite as informações a qualquer momento.

### Lembretes
Configure horários para tomar seus remédios. Os lembretes respeitam seu fuso horário local — ao criar um lembrete, o horário é salvo junto com o fuso horário da época, garantindo que mudanças futuras de fuso não alterem lembretes já criados.

### Dashboard
Painel de início com:
- Resumo do dia atual (dor, fadiga, humor)
- Contagem de dias registrados na semana
- Orientações contextuais baseadas no progresso
- Checklist de onboarding para novos usuários

### Perfil
Edite seu nome e fuso horário. O app detecta o fuso horário do dispositivo e oferece a opção de usá-lo como sugestão — sem alterar automaticamente.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) — App Router, Server Components, Server Actions |
| Banco de dados | [Supabase](https://supabase.com) — PostgreSQL com Row Level Security |
| Autenticação | Supabase Auth — email/senha com recuperação de senha |
| Estilização | [Tailwind CSS v4](https://tailwindcss.com) |
| Formulários | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Deploy | [Vercel](https://vercel.com) |
| Linguagem | TypeScript |

---

## Arquitetura

```
src/
├── app/                    # Rotas (Next.js App Router)
│   ├── (app)/              # Rotas protegidas (requer login)
│   │   ├── dashboard/
│   │   ├── daily/
│   │   ├── history/
│   │   ├── medications/
│   │   ├── reminders/
│   │   └── profile/
│   ├── (auth)/             # Rotas públicas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   ├── reset-password/
│   │   └── update-password/
│   └── auth/callback/      # Callback de recuperação de senha
├── features/               # Lógica de negócio por domínio
│   ├── auth/
│   ├── daily-log/
│   ├── dashboard/
│   ├── history/
│   ├── medications/
│   ├── profile/
│   └── reminders/
├── components/             # Componentes compartilhados
├── lib/                    # Utilitários (supabase, logger, env)
└── types/                  # Tipos TypeScript globais
```

**Princípios:**
- Server Components por padrão — dados buscados no servidor, sem waterfalls no cliente
- Server Actions para todas as mutações — sem rotas de API separadas
- Row Level Security em todas as tabelas — cada usuário acessa apenas seus próprios dados
- Validação em duas camadas: Zod no cliente (UX) e no servidor (segurança)

---

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### 2. Clonar o repositório
```bash
git clone https://github.com/daniel-icaro10/Vivavale.git
cd Vivavale
npm install
```

### 3. Configurar variáveis de ambiente
Criar o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configurar o banco de dados
No SQL Editor do Supabase, executar os arquivos em ordem:

```
supabase/migrations/001_profiles.sql
supabase/migrations/002_schema_corrections.sql
supabase/migrations/003_reminders.sql
```

### 5. Rodar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy

Consulte o guia completo em [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md).

Resumo:
1. Criar projeto na Vercel e conectar ao repositório
2. Configurar as variáveis de ambiente no painel da Vercel
3. Configurar as URLs de redirect no Supabase em Authentication → URL Configuration
4. Executar as migrations no banco de produção

---

## Scripts disponíveis

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run start      # Servidor de produção local
npm run lint       # ESLint
npm run format     # Prettier
```

---

## Banco de dados

### Tabelas

| Tabela | Descrição |
|---|---|
| `profiles` | Dados do usuário (nome, fuso horário) |
| `daily_logs` | Registros diários de sintomas |
| `medications` | Medicamentos cadastrados |
| `reminders` | Lembretes de horários de medicação |
| `notification_preferences` | Preferências de notificação |

Todas as tabelas possuem Row Level Security ativado — cada usuário acessa apenas seus próprios registros.

---

## Segurança

- Autenticação gerenciada pelo Supabase Auth
- Row Level Security em todas as tabelas do banco
- Validação de dados nas server actions (não confia no cliente)
- Headers de segurança configurados: HSTS, CSP, X-Frame-Options, Referrer-Policy
- Variáveis de ambiente validadas na inicialização do servidor
- Nenhum dado sensível exposto no cliente

---

## Documentação

| Documento | Descrição |
|---|---|
| [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) | Passo a passo de deploy na Vercel |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Checklist pré e pós-deploy |
| [docs/OBSERVABILITY_PLAN.md](docs/OBSERVABILITY_PLAN.md) | Estratégia de monitoramento e logs |
