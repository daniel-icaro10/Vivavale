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
    description: "Para o app entender sua rotina.",
    href: "/medications",
    label: "Adicionar",
  },
  {
    key: "log",
    title: "Registrar como você está hoje",
    description: "Um momento rápido de atenção ao seu corpo.",
    href: "/daily",
    label: "Registrar",
  },
  {
    key: "reminders",
    title: "Configurar um lembrete",
    description: "Para não esquecer de cuidar de você.",
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
      ? "Três passos simples para começar o acompanhamento."
      : stepsCompleted === 1
        ? "Continue no seu ritmo — sem pressa."
        : "Mais um passo e você está pronto.";

  return (
    <div className="py-2">
      <p className="vl-eyebrow mb-3">{welcomeTitle}</p>
      <p
        className="text-[15px] leading-relaxed text-foreground/75"
        style={{ letterSpacing: "-0.004em" }}
      >
        {welcomeBody}
      </p>

      <ol className="mt-6 space-y-5" aria-label="Passos de configuração">
        {STEPS.map((step, i) => {
          const isDone = completed[i];
          return (
            <li key={step.key} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isDone
                    ? "bg-primary/12 text-primary/60"
                    : "border border-border/60 text-muted-foreground/50",
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
                      ? "text-muted-foreground/50 line-through decoration-muted-foreground/30"
                      : "font-medium text-foreground",
                  )}
                >
                  {step.title}
                </p>

                {!isDone && (
                  <>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground/65">
                      {step.description}
                    </p>
                    <Link
                      href={step.href}
                      className="mt-1.5 inline-flex min-h-[44px] items-center py-2.5 text-xs font-medium text-primary/80 hover:text-primary transition-colors"
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
