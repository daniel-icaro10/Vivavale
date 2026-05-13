"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Medication, Reminder } from "@/types/app";
import { createReminderAction, updateReminderAction } from "../actions";
import {
  reminderFormSchema,
  type ReminderFormInput,
  type ReminderFormData,
} from "../schemas";
import type { ReminderSaveStatus } from "../types";
import { RECURRENCE_OPTIONS } from "../constants";
import { normalizeTimeLocal } from "../utils/scheduling";
import { SaveReminderButton } from "./SaveReminderButton";

interface ReminderFormProps {
  reminder?: Reminder;
  medications: Pick<Medication, "id" | "name" | "active">[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReminderForm({
  reminder,
  medications,
  onSuccess,
  onCancel,
}: ReminderFormProps) {
  const isEdit = reminder !== undefined;

  const [saveStatus, setSaveStatus] = useState<ReminderSaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFormInput, unknown, ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      medication_id: reminder?.medication_id ?? "",
      time_local: reminder
        ? normalizeTimeLocal(reminder.time_local)
        : "08:00",
      recurrence: (reminder?.recurrence as "daily" | "weekdays") ?? "daily",
      active: reminder?.active ?? true,
    },
  });

  useEffect(() => {
    if (saveStatus !== "success") return;
    const timer = setTimeout(onSuccess, 1200);
    return () => clearTimeout(timer);
  }, [saveStatus, onSuccess]);

  const onSubmit = async (data: ReminderFormData) => {
    setSaveStatus("saving");
    setErrorMessage(undefined);
    try {
      const result = isEdit
        ? await updateReminderAction(reminder.id, data)
        : await createReminderAction(data);

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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {isEdit ? "Editar lembrete" : "Novo lembrete"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Ajuste o horário ou a frequência."
            : "Escolha o remédio e o horário."}
        </p>
      </div>

      {/* Medicamento */}
      <div className="space-y-2">
        <label
          htmlFor="medication_id"
          className="text-sm font-medium text-foreground"
        >
          Remédio
        </label>
        {medications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum remédio cadastrado ainda.
          </p>
        ) : (
          <select
            id="medication_id"
            aria-invalid={!!errors.medication_id}
            aria-describedby={
              errors.medication_id ? "medication-error" : undefined
            }
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            )}
            {...register("medication_id")}
          >
            <option value="">Selecione um remédio</option>
            {medications.map((med) => (
              <option key={med.id} value={med.id}>
                {med.active ? med.name : `${med.name} (inativa)`}
              </option>
            ))}
          </select>
        )}
        {errors.medication_id && (
          <p
            id="medication-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.medication_id.message}
          </p>
        )}
      </div>

      {/* Horário */}
      <div className="space-y-2">
        <label
          htmlFor="time_local"
          className="text-sm font-medium text-foreground"
        >
          Horário
        </label>
        <Input
          id="time_local"
          type="time"
          aria-invalid={!!errors.time_local}
          aria-describedby={errors.time_local ? "time-error" : undefined}
          className="h-10"
          {...register("time_local")}
        />
        {errors.time_local && (
          <p id="time-error" role="alert" className="text-xs text-destructive">
            {errors.time_local.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Horário no seu fuso local — salvo automaticamente.
        </p>
      </div>

      {/* Frequência */}
      <div className="space-y-2">
        <label
          htmlFor="recurrence"
          className="text-sm font-medium text-foreground"
        >
          Frequência
        </label>
        <select
          id="recurrence"
          aria-invalid={!!errors.recurrence}
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
          {...register("recurrence")}
        >
          {RECURRENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.recurrence && (
          <p role="alert" className="text-xs text-destructive">
            {errors.recurrence.message}
          </p>
        )}
      </div>

      {/* Ativo */}
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3.5 py-3">
        <input
          type="checkbox"
          id="active"
          className="size-5 cursor-pointer rounded accent-primary"
          {...register("active")}
        />
        <span className="text-sm font-medium text-foreground">
          Lembrete ativo
        </span>
      </label>

      {/* Status + ações */}
      <div className="space-y-3">
        <div
          className={cn(
            "min-h-10 transition-opacity duration-200",
            saveStatus === "idle" ? "opacity-0" : "opacity-100",
          )}
        >
          <div aria-live="polite" aria-atomic="true">
            {saveStatus === "saving" && (
              <p className="py-2.5 text-center text-sm text-muted-foreground">
                Salvando...
              </p>
            )}
            {saveStatus === "success" && (
              <p className="rounded-lg bg-accent/25 px-3 py-2.5 text-center text-sm font-medium text-accent-foreground">
                Pronto.
              </p>
            )}
          </div>
          <div role="alert" aria-atomic="true">
            {saveStatus === "error" && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-center text-sm text-destructive">
                {errorMessage ?? "Não foi possível salvar. Tente novamente."}
              </p>
            )}
          </div>
        </div>

        <SaveReminderButton isSaving={isSubmitting} isEdit={isEdit} />
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
