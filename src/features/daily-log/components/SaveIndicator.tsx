import { cn } from "@/lib/utils";
import type { SaveStatus } from "../types";

interface SaveIndicatorProps {
  status: SaveStatus;
  errorMessage?: string;
}

export function SaveIndicator({ status, errorMessage }: SaveIndicatorProps) {
  return (
    <div
      className={cn(
        "min-h-10 transition-opacity duration-300",
        status === "idle" ? "opacity-0" : "opacity-100",
      )}
    >
      <div aria-live="polite" aria-atomic="true">
        {status === "saving" && (
          <p className="py-2.5 text-center text-sm text-muted-foreground/50">
            Anotando...
          </p>
        )}
        {status === "success" && (
          <p className="py-2.5 text-center text-sm text-muted-foreground/60">
            Anotado. Cuide-se.
          </p>
        )}
      </div>
      <div role="alert" aria-atomic="true">
        {status === "error" && (
          <p className="rounded-lg bg-destructive/8 px-3 py-2.5 text-center text-sm text-destructive/80">
            {errorMessage ?? "Não foi possível salvar. Tente novamente."}
          </p>
        )}
      </div>
    </div>
  );
}
