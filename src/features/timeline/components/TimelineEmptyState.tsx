import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function TimelineEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-lg font-semibold text-foreground">Nenhum registro ainda</p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Comece a registrar como você está se sentindo para acompanhar sua evolução ao longo do tempo.
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
