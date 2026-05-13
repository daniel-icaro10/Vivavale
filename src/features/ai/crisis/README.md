# Crisis Detection — Arquitetura Futura (NÃO IMPLEMENTADA)

Este módulo documenta a estratégia de detecção de termos de crise em notas de usuário.

## Status

NÃO IMPLEMENTADO. Este arquivo é exclusivamente arquitetural.
O produto VivaLeve NÃO oferece suporte psicológico, NÃO responde a crises e NÃO substitui serviços de saúde mental.

## Por que documentar agora?

Para que, quando e se implementado, exista uma estratégia clara e segura.

## Arquitetura proposta

```
nota do usuário
    ↓
crisisTermDetector() — regex pattern matching, purely deterministic
    ↓ (termo detectado)
NÃO enviar para IA
    ↓
Mostrar banner estático fixo com recursos de apoio (CVV: 188, etc.)
    ↓
Nunca bloquear o usuário — continuar permitindo registro
```

## Regras

- Detecção puramente determinística (sem IA no pipeline de crise)
- Nunca inferir estado emocional — apenas palavras-chave específicas
- Resposta: banner informativo, não modal bloqueante
- NUNCA tentar "resolver" a crise dentro do app
- NUNCA coletar dados adicionais sobre a crise
- NUNCA treinar modelos com dados de crise

## Recursos de apoio (Brasil)

- CVV (Centro de Valorização da Vida): 188 (gratuito, 24h)
- CAPS da região
- UPA / SAMU 192

## Implementação futura

Criar `crisisTermDetector(notes: string): boolean` em módulo isolado.
Ativar via feature flag `CRISIS_DETECTION_ENABLED`.
Revisar lista de termos com profissional de saúde mental antes de deploy.
