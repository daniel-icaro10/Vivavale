import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { groupLogsByMonth } from "@/features/history/utils/groupLogsByMonth";
import { HistoryList } from "@/features/history/components/HistoryList";
import { HistoryEmptyState } from "@/features/history/components/HistoryEmptyState";
import type { DailyLog } from "@/types/app";

export const metadata: Metadata = {
  title: "Histórico",
};

const HISTORY_LIMIT = 30;

async function getRecentLogs(): Promise<DailyLog[]> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(HISTORY_LIMIT);

  return data ?? [];
}

export default async function HistoryPage() {
  const logs = await getRecentLogs();
  const groups = groupLogsByMonth(logs);

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Como você tem estado nos últimos dias"
      />

      {groups.length === 0 ? (
        <HistoryEmptyState />
      ) : (
        <HistoryList groups={groups} totalLogs={logs.length} />
      )}
    </>
  );
}
