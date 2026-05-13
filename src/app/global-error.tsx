"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error("Erro crítico de renderização", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f8fc",
          color: "#1a1a2e",
        }}
      >
        <p style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
          Algo deu muito errado
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            maxWidth: "320px",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          O aplicativo encontrou um erro inesperado. Tente recarregar a página.
        </p>
        <button
          onClick={unstable_retry}
          style={{
            marginTop: "8px",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#6c63ff",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
