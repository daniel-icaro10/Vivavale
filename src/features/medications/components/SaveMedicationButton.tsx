import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SaveMedicationButtonProps {
  isSaving: boolean;
  isEdit: boolean;
}

export function SaveMedicationButton({
  isSaving,
  isEdit,
}: SaveMedicationButtonProps) {
  return (
    <Button type="submit" disabled={isSaving} className="h-11 w-full">
      {isSaving ? (
        <>
          <Spinner />
          Salvando...
        </>
      ) : isEdit ? (
        "Atualizar"
      ) : (
        "Salvar"
      )}
    </Button>
  );
}
