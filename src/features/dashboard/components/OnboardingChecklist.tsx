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

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-sm font-semibold text-foreground">Como começar</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Três passos simples para aproveitar o VivaLeve.
      </p>

      <ol className="mt-4 space-y-4" aria-label="Passos de configuração">
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
