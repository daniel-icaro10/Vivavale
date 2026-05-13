# ARCHITECTURE.md

# Arquitetura do Projeto

---

# Objetivo Arquitetural

Criar uma aplicação:
- escalável
- organizada
- modular
- acessível
- simples de manter
- preparada para crescimento futuro

A arquitetura deve priorizar:
- separação de responsabilidades
- componentização
- reutilização
- clareza estrutural

---

# Stack Principal

## Frontend
- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui

## Backend
- Supabase

## Banco
- PostgreSQL (Supabase)

---

# Estrutura Geral

```txt
src/
 ├── app/
 ├── components/
 ├── features/
 ├── services/
 ├── hooks/
 ├── lib/
 ├── types/
 ├── utils/
 └── styles/