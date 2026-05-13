import Link from "next/link";
import { cn } from "@/lib/utils";

interface OnboardingChecklistProps {
  hasMedications: boolean;
  hasLoggedToday: boolean;
  hasReminders: boolean;
}

const STEPS = [
  {
    key: "medications",
    title: "Adicionar seus remédios",
    description: "Para o app saber o que você toma.",
    href: "/medications",
    label: "Adicionar",
  },
  {
    key: "log",
    title: "Registrar como você está hoje",
    description: "Um registro rápido dos seus sintomas.",
    href: "/daily",
    label: "Registrar",
  },
  {
    key: "reminders",
    title: "Configurar um lembrete",
    description: "Para não esquecer de tomar seus remédios.",
    href: "/reminders",
    label: "Configurar",
  },
] as const;

export function OnboardingChecklist({
  hasMedications,
  hasLoggedToday,
  hasReminders,
}: OnboardingChecklistProps) {
  const completed = [hasMedications, hasLoggedToday, hasReminders];
  const stepsCompleted = completed.filter(Boolean).length;

  const welcomeTitle =
    stepsCompleted === 0
      ? "Bem-vindo ao VivaLeve"
      : stepsCompleted === 1
        ? "Bom começo"
        : "Quase lá";

  const welcomeBody =
    stepsCompleted === 0
      ? "Três passos simples para começar o seu acompanhamento."
      : stepsCompleted === 1
        ? "Continue no seu ritmo — sem pressa."
        : "Mais um passo e você está pronto.";

  return (
    <div
      className="rounded-2xl px-5 py-6 shadow-xs"
      style={{ background: "oklch(0.970 0.010 80)", border: "1px solid oklch(0.940 0.012 80)" }}
    >
      <p className="text-base font-semibold text-foreground">{welcomeTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {welcomeBody}
      </p>

      <ol className="mt-5 space-y-4" aria-label="Passos de configuração">
        {STEPS.map((step, i) => {
          const isDone = completed[i];
          return (
            <li key={step.key} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isDone
                    ? "bg-primary/15 text-primary"
                    : "border border-border text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {isDone ? "✓" : i + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm",
                    isDone
                      ? "font-medium text-muted-foreground line-through decoration-muted-foreground/40"
                      : "font-medium text-foreground",
                  )}
                >
                  {step.title}
                </p>

                {!isDone && (
                  <>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    <Link
                      href={step.href}
                      className="mt-1.5 inline-flex min-h-[44px] items-center gap-1 py-2.5 text-xs font-medium text-primary hover:underline"
                    >
                      {step.label} →
                    </Link>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
