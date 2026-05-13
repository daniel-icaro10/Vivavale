interface MedicationStatusBadgeProps {
  active: boolean;
}

export function MedicationStatusBadge({ active }: MedicationStatusBadgeProps) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
      Em uso
    </span>
  );
}
