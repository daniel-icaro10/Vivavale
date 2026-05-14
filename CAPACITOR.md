# VivaLeve — Capacitor Setup

Guia para empacotar o VivaLeve como app nativo (iOS / Android) usando Capacitor.

## Pré-requisitos

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/haptics
npx cap init VivaLeve com.vivaleve.app --web-dir out
```

> O Next.js com App Router exige exportação estática para Capacitor funcionar.
> Adicione `output: "export"` em `next.config.ts`.

## Build

```bash
# 1. Gerar o bundle estático
npm run build

# 2. Sincronizar com plataformas nativas
npx cap sync

# 3. Abrir no Xcode / Android Studio
npx cap open ios
npx cap open android
```

## Haptics nativos

Substitua `src/lib/haptics.ts` pela versão Capacitor quando no contexto nativo:

```ts
// Versão nativa — usar apenas após cap add
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const haptics = {
  lightImpact:  () => Haptics.impact({ style: ImpactStyle.Light }),
  mediumImpact: () => Haptics.impact({ style: ImpactStyle.Medium }),
  heavyImpact:  () => Haptics.impact({ style: ImpactStyle.Heavy }),
  selection:    () => Haptics.selectionStart(),
  success:      () => Haptics.notification({ type: "SUCCESS" }),
  warning:      () => Haptics.notification({ type: "WARNING" }),
  impact: (style = "light") => haptics[`${style}Impact`](),
};
```

Recomendação: usar alias de importação em `capacitor.config.ts` para trocar o módulo automaticamente por plataforma.

## Supabase Auth no Capacitor

O fluxo OAuth do Supabase requer deep link customizado:

1. Configurar scheme no `capacitor.config.ts`:
   ```ts
   server: { androidScheme: "vivaleve" }
   ```

2. Adicionar URL de redirect ao Supabase Dashboard:
   `vivaleve://login-callback`

3. Usar `supabase.auth.onAuthStateChange` para capturar o callback.

## Safe Area

As variáveis CSS `env(safe-area-inset-*)` já estão configuradas no app
(`viewport-fit=cover` no layout, padding nas shells). Nenhuma mudança adicional necessária.

## Status line / splash

- Tema claro apenas (`color-scheme: light` no `globals.css`)
- `theme_color` no `manifest.json` corresponde ao background principal
- Para splash nativa no iOS: usar Xcode → LaunchScreen.storyboard

## Push Notifications nativas

```bash
npm install @capacitor/push-notifications
npx cap sync
```

Integrar com o sistema VAPID existente em `src/lib/push.ts`.
No iOS exige entitlement APNs — configurar no Apple Developer Portal.

## Checklist antes de publicar

- [ ] `next.config.ts` com `output: "export"`
- [ ] `capacitor.config.ts` configurado
- [ ] Deep links testados (OAuth callback)
- [ ] Push notifications testadas em dispositivo real
- [ ] Haptics substituídos pela versão nativa
- [ ] Splash screen configurada no Xcode/Android Studio
- [ ] Icons nativos gerados (1024×1024 PNG para iOS)
