import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { DailyLogForm } from "@/features/daily-log/components/DailyLogForm";
import type { DailyLog } from "@/types/app";

export const metadata: Metadata = {
  title: "Registro diário",
};

async function getMostRecentLog(): Promise<DailyLog | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export default async function DailyPage() {
  const recentLog = await getMostRecentLog();

  return <DailyLogForm recentLog={recentLog} />;
}
