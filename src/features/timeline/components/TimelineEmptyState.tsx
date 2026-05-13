import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function TimelineEmptyState() {
  return (
    <div className="flex flex-col items-center px-5 py-20 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "oklch(0.968 0.008 80)" }}
        aria-hidden="true"
      >
        <span className="text-2xl leading-none text-muted-foreground/50">◎</span>
      </div>
      <p className="text-base font-semibold text-foreground">Seus dias, ao seu ritmo</p>
      <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
        Cada registro é um cuidado consigo. Comece quando estiver pronto.
      </p>
      <Link
        href="/daily"
        className={cn(buttonVariants(), "mt-6 h-10 px-5 text-sm")}
      >
        Fazer primeiro registro
      </Link>
    </div>
  );
}
