import { Button } from "@/components/ui/button";

interface MedicationEmptyStateProps {
  onAdd: () => void;
}

export function MedicationEmptyState({ onAdd }: MedicationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-base font-medium text-foreground">
        Seus remédios ficam aqui
      </p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        Registre o que você usa hoje ou já usou — para ter tudo num só lugar.
      </p>
      <Button variant="outline" onClick={onAdd} className="mt-2">
        Adicionar um remédio
      </Button>
    </div>
  );
}
