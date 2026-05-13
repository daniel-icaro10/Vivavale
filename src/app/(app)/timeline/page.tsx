import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { TimelineClient } from "@/features/timeline/components/TimelineClient";
import { TimelineEmptyState } from "@/features/timeline/components/TimelineEmptyState";
import type { DailyLog } from "@/types/app";
import { TIMELINE_PAGE_SIZE } from "@/features/insights/constants/thresholds";

export const metadata: Metadata = {
  title: "Evolução",
};

async function getInitialLogs(): Promise<{ logs: DailyLog[]; nextCursor: string | null }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { logs: [], nextCursor: null };

  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(TIMELINE_PAGE_SIZE);

  const logs = data ?? [];
  const nextCursor = logs.length === TIMELINE_PAGE_SIZE ? logs[logs.length - 1].date : null;

  return { logs, nextCursor };
}

export default async function TimelinePage() {
  const { logs, nextCursor } = await getInitialLogs();

  return (
    <>
      <PageHeader
        title="Evolução"
        description="Como você tem se sentido ao longo do tempo"
      />

      {logs.length === 0 ? (
        <TimelineEmptyState />
      ) : (
        <TimelineClient initialLogs={logs} initialCursor={nextCursor} />
      )}
    </>
  );
}
