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
        "min-h-10 transition-opacity duration-200",
        status === "idle" ? "opacity-0" : "opacity-100",
      )}
    >
      <div aria-live="polite" aria-atomic="true">
        {status === "saving" && (
          <p className="py-2.5 text-center text-sm text-muted-foreground">
            Anotando...
          </p>
        )}
        {status === "success" && (
          <p className="rounded-lg bg-accent/25 px-3 py-2.5 text-center text-sm font-medium text-accent-foreground">
            Anotado. Fique bem.
          </p>
        )}
      </div>
      <div role="alert" aria-atomic="true">
        {status === "error" && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-center text-sm text-destructive">
            {errorMessage ?? "Não foi possível salvar. Tente novamente."}
          </p>
        )}
      </div>
    </div>
  );
}
