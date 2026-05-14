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
import { SaveIndicator } from "./SaveIndicator";
import { haptics } from "@/lib/haptics";

// Grupos emocionais — reduz carga cognitiva, cria narrativa visual
const PHYSICAL_FIELDS = [
  { key: "pain_level"    as const, label: "Dor",    low: "Sem dor",    high: "Intensa"   },
  { key: "fatigue_level" as const, label: "Fadiga",  low: "Descansado", high: "Exausto"   },
] as const;

const WELLBEING_FIELDS = [
  { key: "sleep_quality" as const, label: "Sono",      low: "Péssimo",   high: "Ótimo"    },
  { key: "mood_level"    as const, label: "Humor",     low: "Muito baixo", high: "Muito bem" },
  { key: "anxiety_level" as const, label: "Ansiedade", low: "Calmo",     high: "Intensa"  },
] as const;

function toLocalDateString(date: Date): string {
  return date.toLocaleDateString("sv-SE");
}

function SliderField({
  fieldKey,
  label,
  low,
  high,
  value,
  register,
}: {
  fieldKey: string;
  label: string;
  low: string;
  high: string;
  value: number;
  register: ReturnType<typeof useForm<DailyLogFormData>>["register"];
}) {
  const pct = `${Math.round((value / 10) * 100)}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={fieldKey} className="text-sm text-foreground/70">
          {label}
        </label>
        <span
          className="min-w-[2rem] text-right text-[15px] font-semibold tabular-nums text-foreground/60"
          aria-hidden="true"
        >
          {value}
        </span>
      </div>
      <input
        id={fieldKey}
        type="range"
        min={0}
        max={10}
        step={1}
        style={{ "--vl-pct": pct } as React.CSSProperties}
        className="vl-slider"
        {...register(fieldKey as keyof DailyLogFormData, { valueAsNumber: true })}
      />
      <div className="flex justify-between">
        <span className="text-[11px] text-muted-foreground">{low}</span>
        <span className="text-[11px] text-muted-foreground">{high}</span>
      </div>
    </div>
  );
}

interface DailyLogFormProps {
  recentLog: DailyLog | null;
}

export function DailyLogForm({ recentLog }: DailyLogFormProps) {
  const today = new Date();
  const todayStr = toLocalDateString(today);

  const initialLog = recentLog?.date === todayStr ? recentLog : null;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  // Auto-abrir notas se já tem conteúdo — reduz perda de contexto
  const [notesVisible, setNotesVisible] = useState(!!initialLog?.notes);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      date:          todayStr,
      pain_level:    initialLog?.pain_level    ?? 5,
      fatigue_level: initialLog?.fatigue_level ?? 5,
      sleep_quality: initialLog?.sleep_quality ?? 5,
      mood_level:    initialLog?.mood_level    ?? 5,
      anxiety_level: initialLog?.anxiety_level ?? 5,
      notes:         initialLog?.notes ?? "",
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
    haptics.lightImpact();
    try {
      const result = await saveDailyLogAction(data);
      if ("error" in result) {
        setSaveStatus("error");
        setErrorMessage(result.error);
        haptics.warning();
      } else {
        setSaveStatus("success");
        haptics.success();
      }
    } catch {
      setSaveStatus("error");
      setErrorMessage("Não foi possível salvar. Tente novamente.");
      haptics.warning();
    }
  };

  const hasExistingLog = initialLog !== null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <DailyLogHeader date={today} hasExistingLog={hasExistingLog} />

      <input type="hidden" {...register("date")} />

      {/* Grupo 1 — Sintomas físicos */}
      <section aria-labelledby="physical-group" className="space-y-5">
        <h2
          id="physical-group"
          className="vl-eyebrow"
        >
          Sintomas físicos
        </h2>
        <div
          className="rounded-2xl bg-card px-5 py-5 shadow-card space-y-6"
        >
          {PHYSICAL_FIELDS.map(({ key, label, low, high }) => (
            <SliderField
              key={key}
              fieldKey={key}
              label={label}
              low={low}
              high={high}
              value={values[key] ?? 5}
              register={register}
            />
          ))}
        </div>
      </section>

      {/* Grupo 2 — Bem-estar */}
      <section aria-labelledby="wellbeing-group" className="space-y-5">
        <h2
          id="wellbeing-group"
          className="vl-eyebrow"
        >
          Bem-estar
        </h2>
        <div
          className="rounded-2xl bg-card px-5 py-5 shadow-card space-y-6"
        >
          {WELLBEING_FIELDS.map(({ key, label, low, high }) => (
            <SliderField
              key={key}
              fieldKey={key}
              label={label}
              low={low}
              high={high}
              value={values[key] ?? 5}
              register={register}
            />
          ))}
        </div>
      </section>

      {/* Anotações — colapsável para reduzir carga cognitiva */}
      <div>
        {notesVisible ? (
          <section aria-labelledby="notes-group" className="space-y-5 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between">
              <h2
                id="notes-group"
                className="vl-eyebrow"
              >
                Anotações
              </h2>
              <button
                type="button"
                onClick={() => setNotesVisible(false)}
                className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors py-1 px-1"
                aria-label="Ocultar campo de anotações"
              >
                ocultar
              </button>
            </div>
            <div
              className="rounded-2xl bg-card px-5 py-5 shadow-card space-y-2"
            >
              <label htmlFor="notes" className="text-sm font-medium text-foreground">
                Como foi seu dia?
              </label>
              <p className="text-xs text-muted-foreground/70">
                Opcional — uma frase, um pensamento.
              </p>
              <Textarea
                id="notes"
                placeholder="Hoje eu senti..."
                rows={3}
                maxLength={1000}
                aria-invalid={!!errors.notes}
                className="resize-none leading-relaxed px-3.5 py-3 mt-2 text-[15px] overflow-hidden"
                style={{ minHeight: "80px" }}
                onFocus={(e) => {
                  // iOS: scroll até o campo ao abrir teclado (aguarda resize do viewport)
                  setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 340);
                }}
                onInput={(e) => {
                  // Auto-height: cresce com o conteúdo sem barra de scroll
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                {...register("notes")}
              />
              {errors.notes && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setNotesVisible(true)}
            className="flex items-center gap-2 py-2 text-xs font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Adicionar anotação ao registro"
          >
            <span className="text-base leading-none" aria-hidden="true">+</span>
            Adicionar anotação
          </button>
        )}
      </div>

      {/* Salvar — sticky acima do teclado em iOS/Android */}
      <div
        className="space-y-3 pb-2 sticky bottom-[calc(72px+env(safe-area-inset-bottom))]"
        style={{ zIndex: 10 }}
      >
        <SaveIndicator status={saveStatus} errorMessage={errorMessage} />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Salvando…
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
