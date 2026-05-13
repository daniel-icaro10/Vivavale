import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/layout/PageHeader";

export const metadata: Metadata = {
  title: "Remédios",
};

export default function MedicationsPage() {
  return (
    <>
      <PageHeader
        title="Remédios"
        description="Seus medicamentos e horários"
      />

      {/* MedicationList será implementado na Fase 8 */}
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Lista de remédios em construção
      </div>
    </>
  );
}
