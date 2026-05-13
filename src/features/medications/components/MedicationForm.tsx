"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Medication } from "@/types/app";
import { createMedicationAction, updateMedicationAction } from "../actions";
import {
  medicationSchema,
  type MedicationFormData,
  type MedicationFormInput,
} from "../schemas";
import type { MedicationSaveStatus } from "../types";
import { SaveMedicationButton } from "./SaveMedicationButton";

interface MedicationFormProps {
  medication?: Medication;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MedicationForm({
  medication,
  onSuccess,
  onCancel,
}: MedicationFormProps) {
  const isEdit = medication !== undefined;

  const [saveStatus, setSaveStatus] = useState<MedicationSaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // TFieldValues = MedicationFormInput (o que o formulário envia, com campos opcionais)
  // TTransformedValues = MedicationFormData (o que onSubmit recebe, após transforms do Zod)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormInput, unknown, MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: medication?.name ?? "",
      dosage: medication?.dosage ?? "",
      frequency: medication?.frequency ?? "",
      start_date: medication?.start_date ?? "",
      active: medication?.active ?? true,
      notes: medication?.notes ?? "",
    },
  });

  useEffect(() => {
    if (saveStatus !== "success") return;
    const timer = setTimeout(onSuccess, 1200);
    return () => clearTimeout(timer);
  }, [saveStatus, onSuccess]);

  const onSubmit = async (data: MedicationFormData) => {
    setSaveStatus("saving");
    setErrorMessage(undefined);
    try {
      const result = isEdit
        ? await updateMedicationAction(medication.id, data)
        : await createMedicationAction(data);

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
          {isEdit ? `Editando ${medication.name}` : "Novo remédio"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit ? "Mude o que precisar." : "Só o nome é necessário."}
        </p>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nome
        </label>
        <Input
          id="name"
          placeholder="Ex: Metformina"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          autoFocus={!isEdit}
          className="h-10"
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Dose */}
      <div className="space-y-2">
        <label htmlFor="dosage" className="text-sm font-medium text-foreground">
          Dose
        </label>
        <Input
          id="dosage"
          placeholder="Ex: 500mg"
          className="h-10"
          {...register("dosage")}
        />
      </div>

      {/* Frequência */}
      <div className="space-y-2">
        <label
          htmlFor="frequency"
          className="text-sm font-medium text-foreground"
        >
          Frequência
        </label>
        <Input
          id="frequency"
          placeholder="Ex: 1 vez ao dia"
          className="h-10"
          {...register("frequency")}
        />
      </div>

      {/* Data de início */}
      <div className="space-y-2">
        <label
          htmlFor="start_date"
          className="text-sm font-medium text-foreground"
        >
          Data de início
        </label>
        <Input
          id="start_date"
          type="date"
          aria-invalid={!!errors.start_date}
          aria-describedby={errors.start_date ? "start-date-error" : undefined}
          className="h-10"
          {...register("start_date")}
        />
        {errors.start_date && (
          <p
            id="start-date-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.start_date.message}
          </p>
        )}
      </div>

      {/* Ainda em uso */}
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3.5 py-3">
        <input
          type="checkbox"
          id="active"
          className="size-5 cursor-pointer rounded accent-primary"
          {...register("active")}
        />
        <span className="text-sm font-medium text-foreground">
          Ainda estou usando
        </span>
      </label>

      {/* Observações */}
      <div className="space-y-2">
        <label
          htmlFor="notes"
          className="text-sm font-medium text-foreground"
        >
          Observações
        </label>
        <Textarea
          id="notes"
          placeholder="Ex: Tomar com refeições."
          rows={3}
          maxLength={1000}
          className="resize-none px-3.5 py-3 leading-relaxed"
          {...register("notes")}
        />
      </div>

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

        <SaveMedicationButton isSaving={isSubmitting} isEdit={isEdit} />
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
