"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "../actions";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await deleteAccountAction(confirmation);
      if (result && "error" in result) {
        setError(result.error);
      }
      // Em caso de sucesso, deleteAccountAction faz redirect("/") no servidor
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-destructive underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
      >
        Excluir conta e todos os dados
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Tem certeza que deseja excluir sua conta?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Todos os seus dados — registros diários, medicamentos e lembretes —
          serão permanentemente removidos. Esta ação não pode ser desfeita.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label
            htmlFor="delete-confirmation"
            className="text-xs font-medium text-muted-foreground"
          >
            Digite <strong className="text-foreground">DELETAR</strong> para confirmar
          </label>
          <input
            id="delete-confirmation"
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="DELETAR"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || confirmation !== "DELETAR"}
            className="inline-flex h-9 items-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isPending ? "Excluindo…" : "Excluir conta definitivamente"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmation("");
              setError(null);
            }}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
