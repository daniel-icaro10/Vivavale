import { createServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/layout/AppShell";
import type {
  UserPresence,
  JourneyState,
} from "@/features/dashboard/components/AtmosphereProvider";

interface LayoutSignals {
  presence: UserPresence;
  journey: JourneyState | undefined;
}

async function getLayoutSignals(): Promise<LayoutSignals> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { presence: "steady", journey: undefined };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString("sv-SE");

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("date")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(10);

  if (!logs || logs.length === 0) {
    return { presence: "sparse", journey: "beginning" };
  }

  const totalLogsProxy = logs.length;
  const lastDate = logs[0].date;
  const todayStr = new Date().toLocaleDateString("sv-SE");
  const daysSinceLast = Math.floor(
    (new Date(todayStr).getTime() - new Date(lastDate).getTime()) / 86_400_000,
  );
  const daysThisWeek = logs.filter((l) => l.date >= sevenDaysAgoStr).length;

  // Presença comportamental
  let presence: UserPresence = "sparse";
  if (daysSinceLast >= 7)   presence = "returning";
  else if (daysThisWeek >= 5) presence = "consistent";
  else if (daysThisWeek >= 2) presence = "steady";

  // Estado da jornada — profundidade histórica
  let journey: JourneyState | undefined;
  if (daysSinceLast >= 14) {
    journey = "returning-deep";
  } else if (totalLogsProxy >= 10) {
    journey = "established";
  } else if (totalLogsProxy >= 5) {
    journey = "building";
  } else {
    journey = "beginning";
  }

  return { presence, journey };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { presence, journey } = await getLayoutSignals();
  return <AppShell presence={presence} journey={journey}>{children}</AppShell>;
}
