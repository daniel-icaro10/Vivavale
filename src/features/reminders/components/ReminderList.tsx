"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Medication, ReminderWithMedication } from "@/types/app";
import type { Reminder } from "@/types/app";
import type { ReminderDeletePhase } from "../types";
import {
  deleteReminderAction,
  toggleReminderAction,
} from "../actions";
import { ReminderCardWithToggle } from "./ReminderCard";
import { ReminderEmptyState } from "./ReminderEmptyState";
import { ReminderForm } from "./ReminderForm";

type ViewMode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; reminder: Reminder };

interface DeleteState {
  id: string;
  phase: Exclude<ReminderDeletePhase, "idle">;
  message?: string;
}

interface ReminderListProps {
  reminders: ReminderWithMedication[];
  medications: Pick<Medication, "id" | "name" | "active">[];
}

export function ReminderList({ reminders, medications }: ReminderListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>({ kind: "list" });
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);

  function handleAdd() {
    setDeleteState(null);
    setViewMode({ kind: "create" });
  }

  function handleEdit(reminder: Reminder) {
    setDeleteState(null);
    setViewMode({ kind: "edit", reminder });
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
      const result = await deleteReminderAction(id);
      if ("error" in result) {
        setDeleteState({ id, phase: "error", message: result.error });
      } else {
        setDeleteState(null);
      }
    } catch {
      setDeleteState({ id, phase: "error", message: "Não foi possível remover." });
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    const result = await toggleReminderAction(id, !currentActive);
    if ("error" in result) {
      throw new Error(result.error);
    }
  }

  if (viewMode.kind === "create" || viewMode.kind === "edit") {
    return (
      <ReminderForm
        key={viewMode.kind === "edit" ? viewMode.reminder.id : "create"}
        reminder={viewMode.kind === "edit" ? viewMode.reminder : undefined}
        medications={medications}
        onSuccess={handleFormSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (reminders.length === 0) {
    return <ReminderEmptyState onAdd={handleAdd} />;
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => {
        const ds = deleteState?.id === reminder.id ? deleteState : null;
        return (
          <ReminderCardWithToggle
            key={reminder.id}
            reminder={reminder}
            deletePhase={ds?.phase ?? "idle"}
            deleteErrorMessage={ds?.message}
            onEdit={() => handleEdit(reminder)}
            onDeleteRequest={() => handleDeleteRequest(reminder.id)}
            onDeleteConfirm={() => handleDeleteConfirm(reminder.id)}
            onDeleteCancel={handleDeleteCancel}
            onToggle={() => handleToggle(reminder.id, reminder.active)}
          />
        );
      })}

      <button
        type="button"
        onClick={handleAdd}
        className={cn(buttonVariants({ variant: "outline" }), "mt-2 h-11 w-full")}
      >
        Adicionar lembrete
      </button>
    </div>
  );
}
