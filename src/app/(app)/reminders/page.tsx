import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { ReminderList } from "@/features/reminders/components/ReminderList";
import type { Medication, Reminder, ReminderWithMedication } from "@/types/app";

export const metadata: Metadata = {
  title: "Lembretes",
};

async function getRemindersWithMedications(): Promise<{
  reminders: ReminderWithMedication[];
  medications: Pick<Medication, "id" | "name" | "active">[];
}> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { reminders: [], medications: [] };

  const [medicationsResult, remindersResult] = await Promise.all([
    supabase
      .from("medications")
      .select("id, name, active")
      .eq("user_id", user.id)
      .order("active", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("time_local", { ascending: true }),
  ]);

  const medications: Pick<Medication, "id" | "name" | "active">[] =
    medicationsResult.data ?? [];

  const medicationMap = new Map(medications.map((m) => [m.id, m.name]));

  const reminders: ReminderWithMedication[] = (
    (remindersResult.data ?? []) as Reminder[]
  ).map((r) => ({
    ...r,
    medicationName: medicationMap.get(r.medication_id) ?? "Remédio removido",
  }));

  return { reminders, medications };
}

export default async function RemindersPage() {
  const { reminders, medications } = await getRemindersWithMedications();

  return (
    <>
      <PageHeader
        title="Lembretes"
        description="Horários para tomar seus remédios"
      />
      <ReminderList reminders={reminders} medications={medications} />
    </>
  );
}
