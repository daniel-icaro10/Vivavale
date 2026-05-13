import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/layout/PageHeader";

export const metadata: Metadata = {
  title: "Início",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Olá 👋"
        description="Como você está se sentindo hoje?"
      />

      {/* Dashboard content será implementado na Fase 5 */}
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Dashboard em construção
      </div>
    </>
  );
}
