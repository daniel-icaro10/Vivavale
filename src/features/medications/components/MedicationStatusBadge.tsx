interface MedicationStatusBadgeProps {
  active: boolean;
}

export function MedicationStatusBadge({ active }: MedicationStatusBadgeProps) {
  if (!active) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40"
      aria-label="Em uso"
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-accent/50"
        aria-hidden="true"
      />
      Em uso
    </span>
  );
}
