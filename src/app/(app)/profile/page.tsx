import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export const metadata: Metadata = {
  title: "Perfil",
};

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Perfil" description="Suas informações pessoais" />

      {/* ProfileForm será implementado na Fase 3 */}
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Perfil em construção
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </>
  );
}
