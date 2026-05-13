import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Medication } from "@/types/app";
import type { MedicationDeletePhase } from "../types";
import { MedicationStatusBadge } from "./MedicationStatusBadge";

const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatStartDate(dateStr: string): string {
  const [yearStr, monthStr] = dateStr.split("-");
  const month = MONTHS_PT[Number(monthStr) - 1];
  return `Desde ${month}. de ${yearStr}`;
}

interface MedicationCardProps {
  medication: Medication;
  onEdit: () => void;
  deletePhase: MedicationDeletePhase;
  deleteErrorMessage?: string;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function MedicationCard({
  medication,
  onEdit,
  deletePhase,
  deleteErrorMessage,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: MedicationCardProps) {
  const secondaryLine = [medication.dosage, medication.frequency]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      aria-label={medication.name}
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-4 transition-opacity",
        !medication.active && "opacity-60",
      )}
    >
      {/* Nome + badge */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-semibold leading-snug text-foreground">
          {medication.name}
        </p>
        <MedicationStatusBadge active={medication.active} />
      </div>

      {/* Dose · frequência */}
      {secondaryLine && (
        <p className="mt-1 text-sm text-muted-foreground">{secondaryLine}</p>
      )}

      {/* Data de início */}
      {medication.start_date && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatStartDate(medication.start_date)}
        </p>
      )}

      {/* Observações */}
      {medication.notes && (
        <p className="mt-2.5 line-clamp-2 text-xs italic leading-relaxed text-muted-foreground">
          {medication.notes}
        </p>
      )}

      {/* Ações
          idle/confirming/deleting → row h-11 fixa, sem layout shift
          error → caso raro, altura pode variar */}
      <div className="mt-4">
        {deletePhase === "error" ? (
          <div className="space-y-2">
            <p role="alert" className="text-center text-xs text-destructive">
              {deleteErrorMessage ?? "Não foi possível remover."}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 text-sm"
                onClick={onEdit}
              >
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteRequest}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Slot esquerdo */}
            {deletePhase === "idle" && (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 text-sm"
                onClick={onEdit}
              >
                Editar
              </Button>
            )}
            {deletePhase === "confirming" && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm"
                onClick={onDeleteCancel}
              >
                Cancelar
              </Button>
            )}
            {deletePhase === "deleting" && (
              <div className="h-11 flex-1" aria-hidden="true" />
            )}

            {/* Slot direito */}
            {deletePhase === "idle" && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteRequest}
              >
                Remover
              </Button>
            )}
            {deletePhase === "confirming" && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 flex-1 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteConfirm}
              >
                Remover mesmo
              </Button>
            )}
            {deletePhase === "deleting" && (
              <Button
                type="button"
                disabled
                variant="ghost"
                className="h-11 flex-1 text-sm"
              >
                Removendo...
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
