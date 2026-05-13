"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { DailyLog } from "@/types/app";
import { saveDailyLogAction } from "../actions";
import { dailyLogSchema, type DailyLogFormData } from "../schemas";
import type { SaveStatus } from "../types";
import { DailyLogHeader } from "./DailyLogHeader";
import { FormSection } from "./FormSection";
import { SaveIndicator } from "./SaveIndicator";

const SYMPTOM_FIELDS = [
  {
    key: "pain_level" as const,
    label: "Dor",
    description: "Sem dor — Insuportável",
  },
  {
    key: "fatigue_level" as const,
    label: "Fadiga",
    description: "Descansado — Exausto",
  },
  {
    key: "sleep_quality" as const,
    label: "Sono",
    description: "Péssimo — Ótimo",
  },
  {
    key: "mood_level" as const,
    label: "Humor",
    description: "Muito baixo — Muito bem",
  },
  {
    key: "anxiety_level" as const,
    label: "Ansiedade",
    description: "Calmo — Intensa",
  },
] as const;

// sv-SE locale always yields YYYY-MM-DD format (user's local date)
function toLocalDateString(date: Date): string {
  return date.toLocaleDateString("sv-SE");
}

interface DailyLogFormProps {
  recentLog: DailyLog | null;
}

export function DailyLogForm({ recentLog }: DailyLogFormProps) {
  const today = new Date();
  const todayStr = toLocalDateString(today);

  // Compare using the client's local date so timezone is always correct
  const initialLog = recentLog?.date === todayStr ? recentLog : null;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      date: todayStr,
      pain_level: initialLog?.pain_level ?? 5,
      fatigue_level: initialLog?.fatigue_level ?? 5,
      sleep_quality: initialLog?.sleep_quality ?? 5,
      mood_level: initialLog?.mood_level ?? 5,
      anxiety_level: initialLog?.anxiety_level ?? 5,
      notes: initialLog?.notes ?? "",
    },
  });

  const values = useWatch({ control });

  useEffect(() => {
    if (saveStatus !== "success") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const onSubmit = async (data: DailyLogFormData) => {
    setSaveStatus("saving");
    setErrorMessage(undefined);
    try {
      const result = await saveDailyLogAction(data);
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

  const hasExistingLog = initialLog !== null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <DailyLogHeader date={today} hasExistingLog={hasExistingLog} />

      <input type="hidden" {...register("date")} />

      <div className="space-y-6">
        {SYMPTOM_FIELDS.map(({ key, label, description }) => {
          const value = values[key] ?? 5;
          const pct = `${Math.round((value / 10) * 100)}%`;

          return (
            <FormSection key={key}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor={key}
                    className="text-sm font-medium text-foreground"
                  >
                    {label}
                  </label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <span
                  className="shrink-0 min-w-8 text-right text-base font-semibold tabular-nums text-primary"
                  aria-hidden="true"
                >
                  {value}
                </span>
              </div>
              <input
                id={key}
                type="range"
                min={0}
                max={10}
                step={1}
                style={{ "--vl-pct": pct } as React.CSSProperties}
                className="vl-slider"
                {...register(key, { valueAsNumber: true })}
              />
            </FormSection>
          );
        })}
      </div>

      <FormSection>
        <div>
          <label
            htmlFor="notes"
            className="text-sm font-medium text-foreground"
          >
            Anotações
          </label>
          <p className="text-xs text-muted-foreground">
            Opcional — escreva o que quiser sobre seu dia
          </p>
        </div>
        <Textarea
          id="notes"
          placeholder="Uma frase, um pensamento... o que você quiser registrar."
          rows={4}
          maxLength={1000}
          aria-invalid={!!errors.notes}
          className="resize-none leading-relaxed px-3.5 py-3"
          {...register("notes")}
        />
        {errors.notes && (
          <p role="alert" className="text-xs text-destructive">
            {errors.notes.message}
          </p>
        )}
      </FormSection>

      <div className="space-y-3">
        <SaveIndicator status={saveStatus} errorMessage={errorMessage} />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Anotando...
            </>
          ) : hasExistingLog ? (
            "Atualizar registro"
          ) : (
            "Salvar registro"
          )}
        </Button>
      </div>
    </form>
  );
}
