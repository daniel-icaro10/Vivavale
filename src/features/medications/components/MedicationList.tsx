"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Medication } from "@/types/app";
import type { MedicationDeletePhase } from "../types";
import { deleteMedicationAction } from "../actions";
import { MedicationCard } from "./MedicationCard";
import { MedicationEmptyState } from "./MedicationEmptyState";
import { MedicationForm } from "./MedicationForm";

type ViewMode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; medication: Medication };

interface DeleteState {
  id: string;
  phase: Exclude<MedicationDeletePhase, "idle">;
  message?: string;
}

interface MedicationListProps {
  medications: Medication[];
}

export function MedicationList({ medications }: MedicationListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>({ kind: "list" });
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);

  function handleAdd() {
    setDeleteState(null);
    setViewMode({ kind: "create" });
  }

  function handleEdit(medication: Medication) {
    setDeleteState(null);
    setViewMode({ kind: "edit", medication });
  }

  function handleFormSuccess() {
    setViewMode({ kind: "list" });
  }

  function handleCancel() {
    setViewMode({ kind: "list" });
  }

  function handleDeleteRequest(id: string) {
    setDeleteState({ id, phase: "confirming" });
  }

  function handleDeleteCancel() {
    setDeleteState(null);
  }

  async function handleDeleteConfirm(id: string) {
    setDeleteState({ id, phase: "deleting" });
    try {
      const result = await deleteMedicationAction(id);
      if ("error" in result) {
        setDeleteState({ id, phase: "error", message: result.error });
      } else {
        setDeleteState(null);
      }
    } catch {
      setDeleteState({
        id,
        phase: "error",
        message: "Não foi possível remover.",
      });
    }
  }

  if (viewMode.kind === "create" || viewMode.kind === "edit") {
    return (
      <MedicationForm
        key={viewMode.kind === "edit" ? viewMode.medication.id : "create"}
        medication={viewMode.kind === "edit" ? viewMode.medication : undefined}
        onSuccess={handleFormSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (medications.length === 0) {
    return <MedicationEmptyState onAdd={handleAdd} />;
  }

  return (
    <div className="space-y-3">
      {medications.map((medication) => {
        const ds = deleteState?.id === medication.id ? deleteState : null;
        return (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onEdit={() => handleEdit(medication)}
            deletePhase={ds?.phase ?? "idle"}
            deleteErrorMessage={ds?.message}
            onDeleteRequest={() => handleDeleteRequest(medication.id)}
            onDeleteConfirm={() => handleDeleteConfirm(medication.id)}
            onDeleteCancel={handleDeleteCancel}
          />
        );
      })}

      <button
        type="button"
        onClick={handleAdd}
        className={cn(buttonVariants({ variant: "outline" }), "mt-2 h-11 w-full")}
      >
        Adicionar remédio
      </button>
    </div>
  );
}
