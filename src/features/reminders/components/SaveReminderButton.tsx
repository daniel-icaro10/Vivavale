import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SaveReminderButtonProps {
  isSaving: boolean;
  isEdit: boolean;
}

export function SaveReminderButton({ isSaving, isEdit }: SaveReminderButtonProps) {
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
