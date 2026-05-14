import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { MedicationList } from "@/features/medications/components/MedicationList";
import type { Medication } from "@/types/app";

export const metadata: Metadata = {
  title: "Remédios",
};

async function getMedications(): Promise<Medication[]> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("medications")
    .select("*")
    .eq("user_id", user.id)
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });

  return data ?? [];
}

export default async function MedicationsPage() {
  const medications = await getMedications();

  return (
    <>
      <PageHeader
        title="Remédios"
        description="Medicamentos ativos"
      />
      <MedicationList medications={medications} />
    </>
  );
}
