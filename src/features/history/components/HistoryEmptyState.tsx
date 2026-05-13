import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function HistoryEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-base font-medium text-foreground">
        Seu histórico começa aqui
      </p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        Cada dia registrado vai aparecendo aqui, aos poucos formando a história
        de como você tem estado.
      </p>
      <Link href="/daily" className={buttonVariants({ variant: "outline" })}>
        Fazer registro de hoje
      </Link>
    </div>
  );
}
