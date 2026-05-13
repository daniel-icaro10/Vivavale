"use client";

import { usePushNotifications } from "../hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function PushToggle() {
  const { state, isProcessing, subscribe, unsubscribe } =
    usePushNotifications();

  const showActivateButton =
    state.status === "unsubscribed" ||
    state.status === "loading" ||
    (state.status === "error" && !state.subscription);
  const showDeactivateButton = state.status === "subscribed";

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Notificações push
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Receba lembretes de medicação diretamente no dispositivo.
          </p>
        </div>
        {state.status === "subscribed" && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-accent/25 px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
            Ativo
          </span>
        )}
      </div>

      {state.status === "unsupported" && (
        <div
          className="rounded-lg border border-border bg-muted/40 px-3.5 py-3"
          role="note"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            Notificações push não são suportadas neste navegador. No iPhone,
            instale o VivaLeve na tela de início e abra por lá (requer iOS
            16.4+).
          </p>
        </div>
      )}

      {state.status === "denied" && (
        <div
          className="rounded-lg border border-border bg-muted/40 px-3.5 py-3"
          role="note"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            Notificações bloqueadas. Para ativar, acesse as configurações do
            navegador e permita notificações para este site.
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3"
          role="alert"
        >
          <p className="text-xs text-destructive">
            {state.errorMessage ??
              "Não foi possível atualizar as notificações."}
          </p>
        </div>
      )}

      {showActivateButton && (
        <Button
          type="button"
          variant="default"
          className="h-11 w-full"
          onClick={subscribe}
          disabled={isProcessing || state.status === "loading"}
        >
          {isProcessing || state.status === "loading" ? (
            <>
              <Spinner />
              Ativando...
            </>
          ) : (
            "Ativar notificações"
          )}
        </Button>
      )}

      {showDeactivateButton && (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={unsubscribe}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Spinner />
              Desativando...
            </>
          ) : (
            "Desativar notificações"
          )}
        </Button>
      )}
    </div>
  );
}
