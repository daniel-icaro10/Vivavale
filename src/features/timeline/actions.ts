"use server";

import { createServerClient } from "@/lib/supabase/server";
import type { DailyLog } from "@/types/app";
import { TIMELINE_PAGE_SIZE } from "@/features/insights/constants/thresholds";

export type LoadMoreResult =
  | { logs: DailyLog[]; nextCursor: string | null }
  | { error: string };

export async function loadMoreLogsAction(before: string): Promise<LoadMoreResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .lt("date", before)
    .order("date", { ascending: false })
    .limit(TIMELINE_PAGE_SIZE);

  if (error) return { error: error.message };

  const logs = data ?? [];
  const nextCursor = logs.length === TIMELINE_PAGE_SIZE ? logs[logs.length - 1].date : null;

  return { logs, nextCursor };
}
