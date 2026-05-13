import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/layout/PageHeader";

export const metadata: Metadata = {
  title: "Histórico",
};

export default function HistoryPage() {
  return (
    <>
      <PageHeader
        title="Histórico"
        description="Seus registros anteriores"
      />

      {/* HistoryList será implementado na Fase 6 */}
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Histórico em construção
      </div>
    </>
  );
}
