"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { saveNotificationPreferencesAction } from "../actions";

type SaveStatus = "idle" | "saving" | "success" | "error";

export interface NotificationPreferencesProps {
  reminders_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

// PostgreSQL time: "HH:MM:SS" → "HH:MM" for <input type="time">
function toTimeInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

// "HH:MM" → "HH:MM" (already in correct format for schema)
function fromTimeInput(value: string): string | null {
  return value.length === 5 ? value : null;
}

export function NotificationPreferencesForm({
  reminders_enabled,
  quiet_hours_start,
  quiet_hours_end,
}: NotificationPreferencesProps) {
  const [enabled, setEnabled] = useState(reminders_enabled);
  const [startTime, setStartTime] = useState(toTimeInput(quiet_hours_start));
  const [endTime, setEndTime] = useState(toTimeInput(quiet_hours_end));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (saveStatus !== "success") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleToggleEnabled = () => {
    setEnabled((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    setErrorMessage(undefined);

    const quietStart = enabled ? fromTimeInput(startTime) : null;
    const quietEnd = enabled ? fromTimeInput(endTime) : null;

    try {
      const result = await saveNotificationPreferencesAction({
        reminders_enabled: enabled,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      });

      if ("error" in result) {
        setSaveStatus("error");
        setErrorMessage(result.error);
      } else {
        setSaveStatus("success");
      }
    } catch {
      setSaveStatus("error");
      setErrorMessage("Não foi possível salvar. Tente novamente.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
      aria-label="Preferências de notificação"
    >
      {/* Toggle — lembretes habilitados */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <label
            htmlFor="reminders-toggle"
            className="text-sm font-medium text-foreground cursor-pointer"
          >
            Lembretes ativos
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Receber alertas nos horários configurados.
          </p>
        </div>
        <button
          id="reminders-toggle"
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggleEnabled}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            enabled ? "bg-primary" : "bg-input",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
              enabled ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>

      {/* Horário de silêncio — visível apenas se lembretes ativos */}
      {enabled && (
        <div className="space-y-4 rounded-xl border border-border bg-muted/20 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Horário de silêncio
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nenhum lembrete será enviado neste período. Deixe em branco para
              receber a qualquer hora.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="quiet-start"
                className="text-xs font-medium text-muted-foreground"
              >
                Início
              </label>
              <input
                id="quiet-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="quiet-end"
                className="text-xs font-medium text-muted-foreground"
              >
                Fim
              </label>
              <input
                id="quiet-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                )}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Intervalos que cruzam a meia-noite funcionam normalmente (ex.:
            22:00 – 07:00).
          </p>
        </div>
      )}

      {/* Feedback de salvamento */}
      <div
        className={cn(
          "min-h-10 transition-opacity duration-200",
          saveStatus === "idle" ? "opacity-0" : "opacity-100",
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {saveStatus === "saving" && (
          <p className="py-2.5 text-center text-sm text-muted-foreground">
            Salvando...
          </p>
        )}
        {saveStatus === "success" && (
          <p className="rounded-lg bg-accent/25 px-3 py-2.5 text-center text-sm font-medium text-accent-foreground">
            Salvo.
          </p>
        )}
        {saveStatus === "error" && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2.5 text-center text-sm text-destructive"
          >
            {errorMessage ?? "Não foi possível salvar. Tente novamente."}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={saveStatus === "saving"}
        className="h-11 w-full"
      >
        {saveStatus === "saving" ? (
          <>
            <Spinner />
            Salvando...
          </>
        ) : (
          "Salvar preferências"
        )}
      </Button>
    </form>
  );
}
