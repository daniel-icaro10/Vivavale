import type { SaveStatus } from "../types";

interface SaveIndicatorProps {
  status: SaveStatus;
  errorMessage?: string;
}

export function SaveIndicator({ status, errorMessage }: SaveIndicatorProps) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <p role="status" className="text-center text-sm text-muted-foreground">
        Anotando...
      </p>
    );
  }

  if (status === "success") {
    return (
      <p
        role="status"
        className="rounded-lg bg-accent/25 px-3 py-2.5 text-center text-sm font-medium text-accent-foreground"
      >
        Anotado com sucesso.
      </p>
    );
  }

  return (
    <p
      role="alert"
      className="rounded-lg bg-destructive/10 px-3 py-2.5 text-center text-sm text-destructive"
    >
      {errorMessage ?? "Não foi possível salvar. Tente novamente."}
    </p>
  );
}
