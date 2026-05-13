"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createPublicSessionAction } from "../actions";
import type { MainSymptom, Frequency, Duration } from "@/features/insights/types";
import {
  SYMPTOM_LABELS,
  FREQUENCY_LABELS,
  DURATION_LABELS,
  IMPACT_LABELS,
} from "@/features/insights/constants";

// ============================================================
// Tipos de estado do formulário
// ============================================================

interface FormState {
  main_symptoms: MainSymptom[];
  intensity: number | null;
  frequency: Frequency | null;
  sleep_quality: number | null;
  energy_level: number | null;
  mood_level: number | null;
  symptom_duration: Duration | null;
  daily_impact: number | null;
  has_medications: boolean | null;
  medications_text: string;
}

const INITIAL: FormState = {
  main_symptoms: [],
  intensity: null,
  frequency: null,
  sleep_quality: null,
  energy_level: null,
  mood_level: null,
  symptom_duration: null,
  daily_impact: null,
  has_medications: null,
  medications_text: "",
};

const TOTAL_STEPS = 9;

// ============================================================
// Sub-componentes reutilizáveis (sem hooks — puro JSX)
// ============================================================

function QuestionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold leading-snug text-foreground">
      {children}
    </h1>
  );
}

function QuestionHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-muted-foreground">{children}</p>;
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-foreground hover:bg-muted/40 active:bg-muted/60",
      )}
    >
      <span>{label}</span>
      {selected && (
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

function ScaleSelector({
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            aria-label={`${n} de 10`}
            className={cn(
              "h-12 rounded-xl text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              value === n
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/70",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1 — {minLabel}</span>
        <span>{maxLabel} — 10</span>
      </div>
    </div>
  );
}

// ============================================================
// Passos individuais
// ============================================================

type UpdateFn = <K extends keyof FormState>(key: K, val: FormState[K]) => void;

function Step1({
  form,
  onToggle,
}: {
  form: FormState;
  onToggle: (s: MainSymptom) => void;
}) {
  const options: MainSymptom[] = ["pain", "fatigue", "anxiety", "sleep", "mood", "other"];
  return (
    <div className="space-y-4">
      <QuestionHeading>Quais sintomas você está sentindo mais?</QuestionHeading>
      <QuestionHint>Selecione um ou mais.</QuestionHint>
      <div className="space-y-2.5">
        {options.map((s) => (
          <OptionButton
            key={s}
            label={SYMPTOM_LABELS[s]}
            selected={form.main_symptoms.includes(s)}
            onClick={() => onToggle(s)}
          />
        ))}
      </div>
    </div>
  );
}

function Step2({ form, onUpdate }: { form: FormState; onUpdate: UpdateFn }) {
  return (
    <div className="space-y-6">
      <QuestionHeading>Qual a intensidade do sintoma principal?</QuestionHeading>
      <QuestionHint>1 = muito leve, 10 = muito intensa.</QuestionHint>
      <ScaleSelector
        value={form.intensity}
        onChange={(v) => onUpdate("intensity", v)}
        minLabel="Muito leve"
        maxLabel="Muito intensa"
      />
    </div>
  );
}

function Step3({ form, onUpdate }: { form: FormState; onUpdate: UpdateFn }) {
  const options: Frequency[] = ["daily", "few_times_week", "weekly", "rarely"];
  return (
    <div className="space-y-4">
      <QuestionHeading>Com que frequência você sente isso?</QuestionHeading>
      <div className="space-y-2.5">
        {options.map((f) => (
          <OptionButton
            key={f}
            label={FREQUENCY_LABELS[f]}
            selected={form.frequency === f}
            onClick={() => onUpdate("frequency", f)}
          />
        ))}
      </div>
    </div>
  );
}

function Step4({ form, onUpdate }: { form: FormState; onUpdate: UpdateFn }) {
  return (
    <div className="space-y-6">
      <QuestionHeading>Como tem sido a qualidade do seu sono?</QuestionHeading>
      <QuestionHint>1 = muito ruim, 10 = excelente.</QuestionHint>
      <ScaleSelector
        value={form.sleep_quality}
        onChange={(v) => onUpdate("sleep_quality", v)}
        minLabel="Muito ruim"
        maxLabel="Excelente"
      />
    </div>
  );
}

function Step5({ form, onUpdate }: { form: FormState; onUpdate: UpdateFn }) {
  return (
    <div className="space-y-6">
      <QuestionHeading>Como está seu nível de energia?</QuestionHeading>
      <QuestionHint>1 = completamente sem energia, 10 = muita energia.</QuestionHint>
      <ScaleSelector
        value={form.energy_level}
        onChange={(v) => onUpdate("energy_level", v)}
        minLabel="Sem energia"
        maxLabel="Muita energia"
      />
    </div>
  );
}

function Step6({ form, onUpdate }: { form: FormState; onUpdate: UpdateFn }) {
  return (
    <div className="space-y-6">
      <QuestionHeading>Como está seu estado emocional?</QuestionHeading>
      <QuestionHint>1 = muito baixo ou ansioso, 10 = calmo e bem.</QuestionHint>
      <ScaleSelector
        value={form.mood_level}
        onChange={(v) => onUpdate("mood_level", v)}
        minLabel="Muito baixo"
        maxLabel="Muito bem"
      />
    </div>
  );
}

function Step7({ form, onUpdate }: { form: FormState; onUpdate: UpdateFn }) {
  const options: Duration[] = ["less_week", "weeks", "months", "over_year"];
  return (
    <div className="space-y-4">
      <QuestionHeading>Há quanto tempo você sente esses sintomas?</QuestionHeading>
      <div className="space-y-2.5">
        {options.map((d) => (
          <OptionButton
            key={d}
            label={DURATION_LABELS[d]}
            selected={form.symptom_duration === d}
            onClick={() => onUpdate("symptom_duration", d)}
          />
        ))}
      </div>
    </div>
  );
}

function Step8({ form, onUpdate }: { form: FormState; onUpdate: UpdateFn }) {
  const options = [1, 2, 3, 4, 5] as const;
  return (
    <div className="space-y-4">
      <QuestionHeading>Esses sintomas afetam suas atividades do dia a dia?</QuestionHeading>
      <div className="space-y-2.5">
        {options.map((n) => (
          <OptionButton
            key={n}
            label={IMPACT_LABELS[n]}
            selected={form.daily_impact === n}
            onClick={() => onUpdate("daily_impact", n)}
          />
        ))}
      </div>
    </div>
  );
}

function Step9({
  form,
  onUpdate,
}: {
  form: FormState;
  onUpdate: UpdateFn;
}) {
  return (
    <div className="space-y-4">
      <QuestionHeading>Você está tomando alguma medicação?</QuestionHeading>
      <div className="space-y-2.5">
        <OptionButton
          label="Sim"
          selected={form.has_medications === true}
          onClick={() => onUpdate("has_medications", true)}
        />
        <OptionButton
          label="Não"
          selected={form.has_medications === false}
          onClick={() => onUpdate("has_medications", false)}
        />
      </div>

      {form.has_medications === true && (
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="medications-text"
            className="text-sm font-medium text-foreground"
          >
            Quais medicamentos? <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="medications-text"
            rows={3}
            maxLength={500}
            placeholder="Ex.: Amitriptilina, Pregabalina..."
            value={form.medications_text}
            onChange={(e) => onUpdate("medications_text", e.target.value)}
            className={cn(
              "w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5",
              "text-base text-foreground placeholder:text-muted-foreground md:text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            )}
          />
          <p className="text-xs text-muted-foreground">
            Essa informação é opcional e não será compartilhada.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Componente principal
// ============================================================

export function AnalyzeFlow() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const headingRef = useRef<HTMLDivElement>(null);

  // Foca no topo do conteúdo a cada troca de passo (acessibilidade)
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return form.main_symptoms.length > 0;
      case 2: return form.intensity !== null;
      case 3: return form.frequency !== null;
      case 4: return form.sleep_quality !== null;
      case 5: return form.energy_level !== null;
      case 6: return form.mood_level !== null;
      case 7: return form.symptom_duration !== null;
      case 8: return form.daily_impact !== null;
      case 9: return form.has_medications !== null;
      default: return false;
    }
  };

  const transition = (direction: 1 | -1) => {
    setVisible(false);
    setTimeout(() => {
      setStep((s) => s + direction);
      setVisible(true);
    }, 140);
  };

  const handleNext = () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      transition(1);
      return;
    }
    // Último passo → submete
    setError(null);
    startTransition(async () => {
      const result = await createPublicSessionAction({
        main_symptoms: form.main_symptoms,
        intensity: form.intensity!,
        frequency: form.frequency!,
        sleep_quality: form.sleep_quality!,
        energy_level: form.energy_level!,
        mood_level: form.mood_level!,
        symptom_duration: form.symptom_duration!,
        daily_impact: form.daily_impact!,
        has_medications: form.has_medications!,
        medications_text: form.medications_text || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/results?session=${result.sessionToken}`);
    });
  };

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const toggleSymptom = (s: MainSymptom) => {
    setForm((prev) => ({
      ...prev,
      main_symptoms: prev.main_symptoms.includes(s)
        ? prev.main_symptoms.filter((x) => x !== s)
        : [...prev.main_symptoms, s],
    }));
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          aria-label="VivaLeve — voltar ao início"
        >
          VivaLeve
        </Link>
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          {step} de {TOTAL_STEPS}
        </span>
      </header>

      {/* Barra de progresso */}
      <div className="px-4">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={`Passo ${step} de ${TOTAL_STEPS}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Conteúdo do passo */}
      <main className="flex-1 px-4 py-8">
        {/* Âncora de foco acessível — invisível, focada ao trocar de passo */}
        <div
          ref={headingRef}
          tabIndex={-1}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          Passo {step} de {TOTAL_STEPS}
        </div>

        <div
          className={cn(
            "transition-opacity duration-150 motion-reduce:transition-none",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {step === 1 && <Step1 form={form} onToggle={toggleSymptom} />}
          {step === 2 && <Step2 form={form} onUpdate={update} />}
          {step === 3 && <Step3 form={form} onUpdate={update} />}
          {step === 4 && <Step4 form={form} onUpdate={update} />}
          {step === 5 && <Step5 form={form} onUpdate={update} />}
          {step === 6 && <Step6 form={form} onUpdate={update} />}
          {step === 7 && <Step7 form={form} onUpdate={update} />}
          {step === 8 && <Step8 form={form} onUpdate={update} />}
          {step === 9 && <Step9 form={form} onUpdate={update} />}
        </div>

        {error && (
          <p role="alert" className="mt-6 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </main>

      {/* Navegação */}
      <div className="space-y-2 px-4 pb-8 pt-2">
        <Button
          type="button"
          className="h-12 w-full text-base"
          onClick={handleNext}
          disabled={!canContinue() || isPending}
        >
          {isPending ? (
            <>
              <Spinner />
              Calculando...
            </>
          ) : step < TOTAL_STEPS ? (
            "Continuar"
          ) : (
            "Ver resultado"
          )}
        </Button>

        {step > 1 && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full text-sm text-muted-foreground"
            onClick={() => transition(-1)}
            disabled={isPending}
          >
            Voltar
          </Button>
        )}
      </div>

      {/* Disclaimer discreto */}
      <p className="px-6 pb-6 text-center text-xs text-muted-foreground">
        Esta análise não substitui avaliação médica.
      </p>
    </div>
  );
}
