"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import {
  savePushSubscriptionAction,
  removePushSubscriptionAction,
} from "../actions";

// ============================================================
// Tipos de estado
// ============================================================

export type PushStatus =
  | "loading"      // verificando estado inicial
  | "unsupported"  // browser/SO não suporta Web Push
  | "denied"       // usuário bloqueou notificações no browser
  | "unsubscribed" // suportado, permissão disponível, não ativado
  | "subscribed"   // ativo e funcionando
  | "error";       // falha ao ativar/desativar

export type PushState = {
  status: PushStatus;
  errorMessage?: string;
  subscription?: PushSubscription;
};

// ============================================================
// Hook
// ============================================================

export function usePushNotifications() {
  const [state, setState] = useState<PushState>(() => {
    // Inicialização lazy: evita setState síncrono em useEffect.
    if (typeof window === "undefined") return { status: "loading" };
    if (!isPushSupported()) return { status: "unsupported" };
    if (getNotificationPermission() === "denied") return { status: "denied" };
    return { status: "loading" };
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Verifica subscription existente apenas quando o estado inicial é "loading"
  useEffect(() => {
    if (state.status !== "loading") return;

    getExistingSubscription().then((sub) => {
      setState(sub ? { status: "subscribed", subscription: sub } : { status: "unsubscribed" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ativa notificações: pede permissão + cria subscription + salva no servidor
  const subscribe = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setState((prev) => ({ ...prev, status: "loading" }));

    try {
      const sub = await subscribeToPush();
      const result = await savePushSubscriptionAction(sub.toJSON());

      if ("error" in result) {
        setState({ status: "error", errorMessage: result.error });
        return;
      }

      setState({ status: "subscribed", subscription: sub });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "permission-denied") {
        setState({ status: "denied" });
      } else {
        setState({
          status: "error",
          errorMessage: "Não foi possível ativar as notificações.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // Desativa notificações: remove subscription do browser + do servidor
  const unsubscribe = useCallback(async () => {
    if (isProcessing || state.status !== "subscribed") return;
    setIsProcessing(true);
    setState((prev) => ({ ...prev, status: "loading" }));

    const endpoint = state.subscription?.endpoint;

    try {
      await unsubscribeFromPush();

      if (endpoint) {
        await removePushSubscriptionAction(endpoint);
      }

      setState({ status: "unsubscribed" });
    } catch {
      setState({
        status: "error",
        errorMessage: "Não foi possível desativar as notificações.",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, state]);

  return { state, isProcessing, subscribe, unsubscribe };
}
