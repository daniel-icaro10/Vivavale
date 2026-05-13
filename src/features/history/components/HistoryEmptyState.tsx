import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function HistoryEmptyState() {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "oklch(0.968 0.008 80)" }}
        aria-hidden="true"
      >
        <span className="text-2xl leading-none text-muted-foreground/50">◑</span>
      </div>
      <p className="text-base font-semibold text-foreground">A história começa no primeiro passo</p>
      <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
        Cada dia registrado vai aparecendo aqui, aos poucos formando o seu caminho.
      </p>
      <Link href="/daily" className={`${buttonVariants({ variant: "outline" })} mt-6`}>
        Fazer registro de hoje
      </Link>
    </div>
  );
}
