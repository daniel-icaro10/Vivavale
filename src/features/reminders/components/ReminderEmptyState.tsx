import { Button } from "@/components/ui/button";

interface ReminderEmptyStateProps {
  onAdd: () => void;
}

export function ReminderEmptyState({ onAdd }: ReminderEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-base font-medium text-foreground">
        Seus lembretes ficam aqui
      </p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        Configure um horário gentil para lembrar de tomar seus remédios.
      </p>
      <Button variant="outline" onClick={onAdd} className="mt-2">
        Adicionar um lembrete
      </Button>
    </div>
  );
}
