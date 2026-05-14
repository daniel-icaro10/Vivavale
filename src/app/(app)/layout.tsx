import { createServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/layout/AppShell";
import type { UserPresence } from "@/features/dashboard/components/AtmosphereProvider";

async function getUserPresence(): Promise<UserPresence> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "steady";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString("sv-SE");

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("date")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(10);

  if (!logs || logs.length === 0) return "sparse";

  const lastDate = logs[0].date;
  const todayStr = new Date().toLocaleDateString("sv-SE");
  const daysSinceLast = Math.floor(
    (new Date(todayStr).getTime() - new Date(lastDate).getTime()) / 86_400_000,
  );
  const daysThisWeek = logs.filter((l) => l.date >= sevenDaysAgoStr).length;

  if (daysSinceLast >= 7) return "returning";
  if (daysThisWeek >= 5) return "consistent";
  if (daysThisWeek >= 2) return "steady";
  return "sparse";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const presence = await getUserPresence();
  return <AppShell presence={presence}>{children}</AppShell>;
}
