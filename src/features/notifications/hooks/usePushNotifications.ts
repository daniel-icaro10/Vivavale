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
  const [state, setState] = useState<PushState>({ status: "loading" });
  const [isProcessing, setIsProcessing] = useState(false);

  // Verifica estado inicial ao montar
  useEffect(() => {
    if (!isPushSupported()) {
      setState({ status: "unsupported" });
      return;
    }

    const permission = getNotificationPermission();
    if (permission === "denied") {
      setState({ status: "denied" });
      return;
    }

    getExistingSubscription().then((sub) => {
      if (sub) {
        setState({ status: "subscribed", subscription: sub });
      } else {
        setState({ status: "unsubscribed" });
      }
    });
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
