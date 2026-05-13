"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error("Erro de segmento de rota", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-base font-semibold text-foreground">
        Algo deu errado
      </p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        Não foi possível carregar esta página. Tente novamente.
      </p>
      <button
        onClick={unstable_retry}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
