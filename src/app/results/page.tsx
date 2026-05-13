import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComputedInsights, InsightSeverity, InsightArea } from "@/features/insights/types";
import { OVERALL_LEVEL_HEADING } from "@/features/insights/constants";

export const metadata: Metadata = {
  title: "Resultado da análise | VivaLeve",
  description: "Veja os padrões identificados nos seus sintomas.",
  robots: { index: false, follow: false },
};

// Ícone por área de insight
const AREA_ICON: Record<InsightArea, string> = {
  pain: "◎",
  fatigue: "◐",
  sleep: "◑",
  mood: "◒",
  impact: "◓",
  pattern: "◈",
};

// Cor do badge de nível
function severityClass(s: InsightSeverity) {
  return s === "notable"
    ? "bg-primary/10 text-primary"
    : s === "moderate"
      ? "bg-accent/20 text-accent-foreground"
      : "bg-muted text-muted-foreground";
}

function severityLabel(s: InsightSeverity) {
  return s === "notable" ? "Atenção" : s === "moderate" ? "Observar" : "Leve";
}

// Rótulo visual do nível geral
function OverallBadge({ level }: { level: InsightSeverity }) {
  const colors = {
    notable: "border-primary/30 bg-primary/5",
    moderate: "border-border bg-muted/30",
    low: "border-border bg-muted/20",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium",
        colors[level],
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 rounded-full",
          level === "notable"
            ? "bg-primary"
            : level === "moderate"
              ? "bg-accent-foreground/40"
              : "bg-muted-foreground/40",
        )}
      />
      {OVERALL_LEVEL_HEADING[level]}
    </div>
  );
}

async function getSession(token: string) {
  const supabase = await createServerClient();
  // Acesso via RPC capability-based: apenas retorna dados do token exato.
  // SELECT direto está bloqueado por RLS (migration 007).
  const { data } = await supabase
    .rpc("get_public_session_insights", { p_token: token });
  if (!data) return null;
  return { computed_insights: data };
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;

  // Sessão ausente ou malformada
  if (!session || !/^[0-9a-f-]{36}$/i.test(session)) {
    return <NotFound />;
  }

  const data = await getSession(session);

  if (!data) {
    return <NotFound />;
  }

  const insights = data.computed_insights as unknown as ComputedInsights;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav simples */}
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          VivaLeve
        </Link>
        <Link
          href="/analyze"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 px-3 text-xs text-muted-foreground",
          )}
        >
          Nova análise
        </Link>
      </header>

      <main className="flex-1 px-5 py-4">
        <div className="mx-auto max-w-xl space-y-6">

          {/* Card de resumo geral */}
          <section
            aria-labelledby="summary-heading"
            className="rounded-2xl border border-border bg-card px-6 py-7 text-center"
          >
            <OverallBadge level={insights.overall_level} />
            <h1
              id="summary-heading"
              className="mt-4 text-xl font-semibold leading-snug text-foreground"
            >
              {OVERALL_LEVEL_HEADING[insights.overall_level]}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {insights.summary}
            </p>
          </section>

          {/* Insights detectados */}
          {insights.insights.length > 0 && (
            <section aria-labelledby="insights-heading">
              <h2
                id="insights-heading"
                className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              >
                O que observamos
              </h2>
              <ul className="space-y-3" role="list">
                {insights.insights.map((insight) => (
                  <li
                    key={insight.id}
                    className="rounded-xl border border-border bg-card px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="text-lg text-muted-foreground"
                        >
                          {AREA_ICON[insight.area]}
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {insight.title}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          severityClass(insight.severity),
                        )}
                        aria-label={`Nível: ${severityLabel(insight.severity)}`}
                      >
                        {severityLabel(insight.severity)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground pl-7">
                      {insight.body}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recomendações suaves */}
          {insights.recommendations.length > 0 && (
            <section aria-labelledby="recs-heading">
              <h2
                id="recs-heading"
                className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Sugestões gentis
              </h2>
              <ul className="space-y-3" role="list">
                {insights.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {rec}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Disclaimer médico */}
          <div
            className="rounded-xl border border-border bg-muted/20 px-4 py-3.5"
            role="note"
            aria-label="Nota importante"
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">Importante:</strong> Esta
              análise não é um diagnóstico médico e não substitui avaliação
              profissional. Se você sentir sintomas graves ou urgentes, procure
              atendimento médico imediatamente.
            </p>
          </div>

          {/* CTA de conversão */}
          <section
            className="rounded-2xl border border-border bg-card px-6 py-8 text-center"
            aria-labelledby="cta-heading"
          >
            <h2
              id="cta-heading"
              className="text-base font-semibold text-foreground"
            >
              Quer acompanhar esses padrões ao longo do tempo?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie uma conta gratuita e monitore sua evolução semana a semana.
            </p>
            <Link
              href="/register"
              className={cn(
                buttonVariants(),
                "mt-5 inline-flex h-11 px-6 text-sm font-semibold",
              )}
            >
              Criar conta gratuitamente
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="underline underline-offset-2">
                Entrar
              </Link>
            </p>
          </section>
        </div>
      </main>

      <footer className="px-5 py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} VivaLeve</p>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 text-center">
      <p className="text-2xl font-semibold text-foreground">Análise não encontrada</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Esta sessão pode ter expirado ou o link está incorreto.
      </p>
      <Link
        href="/analyze"
        className={cn(buttonVariants(), "mt-6 h-11 px-6 text-sm")}
      >
        Fazer nova análise
      </Link>
    </div>
  );
}
