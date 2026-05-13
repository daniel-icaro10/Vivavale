"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ReminderWithMedication } from "@/types/app";
import type { ReminderDeletePhase, ReminderTogglePhase } from "../types";
import { RECURRENCE_LABELS } from "../constants";
import { formatTimeDisplay, normalizeTimeLocal } from "../utils/scheduling";

interface ReminderCardProps {
  reminder: ReminderWithMedication;
  deletePhase: ReminderDeletePhase;
  deleteErrorMessage?: string;
  togglePhase: ReminderTogglePhase;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onToggle: () => void;
}

export function ReminderCard({
  reminder,
  deletePhase,
  deleteErrorMessage,
  togglePhase,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onToggle,
}: ReminderCardProps) {
  const timeDisplay = formatTimeDisplay(normalizeTimeLocal(reminder.time_local));
  const recurrenceLabel =
    RECURRENCE_LABELS[reminder.recurrence] ?? reminder.recurrence;

  return (
    <article
      aria-label={`Lembrete: ${timeDisplay}, ${reminder.medicationName}`}
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-4 transition-opacity",
        !reminder.active && "opacity-60",
      )}
    >
      {/* Horário — destaque visual principal */}
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-2xl font-semibold tabular-nums leading-none text-foreground"
          aria-label={`Horário: ${timeDisplay}`}
        >
          {timeDisplay}
        </p>
        {!reminder.active && (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Pausado
          </span>
        )}
      </div>

      {/* Medicamento + recorrência */}
      <p className="mt-1.5 text-sm font-medium text-foreground">
        {reminder.medicationName}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{recurrenceLabel}</p>

      {/* Toggle de status — informação acessível */}
      {togglePhase === "error" && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          Não foi possível atualizar.
        </p>
      )}

      {/* Ações — mesma estratégia sem layout shift de MedicationCard */}
      <div className="mt-4">
        {deletePhase === "error" ? (
          <div className="space-y-2">
            <p role="alert" className="text-center text-xs text-destructive">
              {deleteErrorMessage ?? "Não foi possível remover."}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 text-sm"
                onClick={onEdit}
              >
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteRequest}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5">
            {/* Slot esquerdo: Editar / Cancelar / (spacer) */}
            {deletePhase === "idle" && (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 text-sm"
                onClick={onEdit}
              >
                Editar
              </Button>
            )}
            {deletePhase === "confirming" && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm"
                onClick={onDeleteCancel}
              >
                Cancelar
              </Button>
            )}
            {deletePhase === "deleting" && (
              <div className="h-11 flex-1" aria-hidden="true" />
            )}

            {/* Slot central: Pausar/Ativar (idle apenas) */}
            {deletePhase === "idle" && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm"
                onClick={onToggle}
                disabled={togglePhase === "toggling"}
                aria-label={reminder.active ? "Pausar lembrete" : "Ativar lembrete"}
              >
                {togglePhase === "toggling"
                  ? "..."
                  : reminder.active
                    ? "Pausar"
                    : "Ativar"}
              </Button>
            )}
            {deletePhase === "confirming" && (
              <div className="h-11 flex-1" aria-hidden="true" />
            )}
            {deletePhase === "deleting" && (
              <div className="h-11 flex-1" aria-hidden="true" />
            )}

            {/* Slot direito: Remover / Remover mesmo / Removendo... */}
            {deletePhase === "idle" && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteRequest}
              >
                Remover
              </Button>
            )}
            {deletePhase === "confirming" && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteConfirm}
              >
                Remover mesmo
              </Button>
            )}
            {deletePhase === "deleting" && (
              <Button
                type="button"
                disabled
                variant="ghost"
                className="h-11 flex-1 text-sm"
              >
                Removendo...
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// Wrapper com estado local de toggle — isola a complexidade do ReminderList
interface ReminderCardWithToggleProps
  extends Omit<ReminderCardProps, "togglePhase" | "onToggle"> {
  onToggle: () => Promise<void>;
}

export function ReminderCardWithToggle({
  onToggle,
  ...props
}: ReminderCardWithToggleProps) {
  const [togglePhase, setTogglePhase] = useState<ReminderTogglePhase>("idle");

  async function handleToggle() {
    setTogglePhase("toggling");
    try {
      await onToggle();
      setTogglePhase("idle");
    } catch {
      setTogglePhase("error");
    }
  }

  return (
    <ReminderCard
      {...props}
      togglePhase={togglePhase}
      onToggle={handleToggle}
    />
  );
}
