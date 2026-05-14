"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "../actions";
import { NativeSheet } from "@/components/shared/NativeSheet";
import { haptics } from "@/lib/haptics";

export function DeleteAccountSection() {
  const [open, setOpen]               = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  function handleClose() {
    setOpen(false);
    setConfirmation("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    haptics.warning();

    startTransition(async () => {
      const result = await deleteAccountAction(confirmation);
      if (result && "error" in result) {
        setError(result.error);
      }
      // Em caso de sucesso, deleteAccountAction faz redirect("/") no servidor
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-destructive underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
      >
        Excluir conta e todos os dados
      </button>

      <NativeSheet open={open} onClose={handleClose} title="Excluir conta">
        <div className="space-y-5 pb-2">
          <div className="space-y-1.5">
            <p className="text-sm text-foreground/75 leading-relaxed">
              Todos os seus dados — registros diários, medicamentos e lembretes —
              serão permanentemente removidos. Esta ação não pode ser desfeita.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
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
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="DELETAR"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending || confirmation !== "DELETAR"}
                className="flex-1 h-11 rounded-xl bg-destructive text-sm font-medium text-destructive-foreground transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isPending ? "Excluindo…" : "Excluir definitivamente"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-11 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </NativeSheet>
    </>
  );
}
