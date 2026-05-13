import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "VivaLeve — Entenda melhor os seus sintomas",
  description:
    "Análise gentil de sintomas para pessoas com dores crônicas e fibromialgia. Identifique padrões, receba insights e acompanhe sua evolução.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "VivaLeve — Entenda melhor os seus sintomas",
    description:
      "Análise gentil de sintomas para pessoas com dores crônicas e fibromialgia.",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-5">
        <span className="text-base font-semibold text-foreground">VivaLeve</span>
        <nav className="flex items-center gap-2" aria-label="Navegação principal">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 px-3 text-sm text-muted-foreground",
            )}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3 text-sm")}
          >
            Criar conta
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section
          className="mx-auto max-w-xl px-5 pb-16 pt-14 text-center"
          aria-labelledby="hero-heading"
        >
          <h1
            id="hero-heading"
            className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
          >
            Entenda melhor
            <br />
            os seus sintomas.
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
            Uma análise gentil baseada nos sinais que você vem sentindo.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/analyze"
              className={cn(
                buttonVariants(),
                "h-12 px-7 text-base font-semibold",
              )}
            >
              Começar análise gratuita
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 px-7 text-base",
              )}
            >
              Acompanhar minha saúde
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Não é diagnóstico médico. Não requer cadastro.
          </p>
        </section>

        {/* Como funciona */}
        <section
          className="mx-auto max-w-xl px-5 py-12"
          aria-labelledby="how-heading"
        >
          <h2
            id="how-heading"
            className="mb-8 text-center text-xl font-semibold text-foreground"
          >
            Como funciona
          </h2>
          <ol className="space-y-6" role="list">
            {[
              {
                n: "1",
                title: "Responda algumas perguntas",
                body: "Sobre intensidade, frequência e o impacto dos sintomas no seu dia a dia. Leva menos de 5 minutos.",
              },
              {
                n: "2",
                title: "Receba insights observacionais",
                body: "Identificamos padrões nos seus relatos de forma gentil e objetiva — sem diagnósticos, sem alarmes.",
              },
              {
                n: "3",
                title: "Acompanhe ao longo do tempo",
                body: "Crie uma conta gratuita e monitore sua evolução. Veja tendências e compartilhe com quem te acompanha.",
              },
            ].map((item) => (
              <li key={item.n} className="flex gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                >
                  {item.n}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Para quem é */}
        <section
          className="mx-auto max-w-xl px-5 py-12"
          aria-labelledby="for-whom-heading"
        >
          <h2
            id="for-whom-heading"
            className="mb-6 text-center text-xl font-semibold text-foreground"
          >
            Para quem é o VivaLeve
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Sem diagnósticos",
                body: "Nenhuma afirmação médica. Apenas padrões observados com linguagem gentil.",
              },
              {
                title: "Para dores crônicas",
                body: "Criado pensando em pessoas com fibromialgia, fadiga crônica e condições similares.",
              },
              {
                title: "Acolhedor e discreto",
                body: "Sem notificações invasivas, sem gamificação, sem pressão. No seu tempo.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border bg-card px-5 py-5"
              >
                <p className="font-medium text-foreground">{card.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-xl px-5 pb-16 pt-4 text-center">
          <div className="rounded-2xl border border-border bg-card px-6 py-10">
            <p className="text-xl font-semibold text-foreground">
              Pronto para entender seus sintomas?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gratuito. Sem cadastro. Sem julgamentos.
            </p>
            <Link
              href="/analyze"
              className={cn(
                buttonVariants(),
                "mt-6 inline-flex h-12 px-8 text-base font-semibold",
              )}
            >
              Começar agora
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-5 py-8">
        <p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
          O VivaLeve não é um dispositivo médico, não emite diagnósticos e não substitui
          avaliação profissional. Em caso de urgência ou sintomas graves, procure atendimento
          médico imediato.
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} VivaLeve
        </p>
      </footer>
    </div>
  );
}
