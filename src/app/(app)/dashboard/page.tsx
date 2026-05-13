import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { OnboardingChecklist } from "@/features/dashboard/components/OnboardingChecklist";
import { TodayCard } from "@/features/dashboard/components/TodayCard";
import { InsightsStrip } from "@/features/dashboard/components/InsightsStrip";
import { GuidanceCard } from "@/features/dashboard/components/GuidanceCard";
import { RecentActivity } from "@/features/dashboard/components/RecentActivity";

export const metadata: Metadata = {
  title: "Início",
};

const WEEKDAYS_PT = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
] as const;

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
] as const;

type DashboardData = NonNullable<Awaited<ReturnType<typeof getDashboardData>>>;

function getHeroContext(data: DashboardData): string {
  const { todayLog, daysThisWeek, lastLogDate, todayStr } = data;

  if (todayLog) {
    if (daysThisWeek >= 5) return "Você está presente e isso faz diferença.";
    if (daysThisWeek >= 3) return "Boa sequência essa semana.";
    return "Bom saber como você está hoje.";
  }

  if (!lastLogDate) return "Pronto para começar o seu acompanhamento.";

  const daysSince = Math.floor(
    (new Date(todayStr).getTime() - new Date(lastLogDate).getTime()) / 86_400_000,
  );

  if (daysSince <= 1) return "Como está sendo esse dia?";
  if (daysSince <= 4) return "Quando quiser, adoraríamos saber como você está.";
  return "Sem pressão — estamos aqui quando fizer sentido.";
}

function formatDatePt(todayStr: string): string {
  const [yearStr, monthStr, dayStr] = todayStr.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  const weekday = WEEKDAYS_PT[date.getDay()];
  const month = MONTHS_PT[Number(monthStr) - 1];
  return `${weekday}, ${Number(dayStr)} de ${month}`;
}

async function getDashboardData() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const todayStr = new Date().toLocaleDateString("sv-SE");

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 6);
  const sevenDaysAgoStr = windowStart.toLocaleDateString("sv-SE");

  const [
    profileResult,
    todayLogResult,
    activeMedicationsResult,
    activeRemindersResult,
    recentLogsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),

    supabase
      .from("daily_logs")
      .select("date, pain_level, fatigue_level, mood_level")
      .eq("user_id", user.id)
      .eq("date", todayStr)
      .maybeSingle(),

    supabase
      .from("medications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("active", true),

    supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("active", true),

    supabase
      .from("daily_logs")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(10),
  ]);

  const activeMedicationsCount = activeMedicationsResult.count ?? 0;
  const activeRemindersCount = activeRemindersResult.count ?? 0;
  const recentLogs = recentLogsResult.data ?? [];
  const lastLogDate = recentLogs[0]?.date ?? null;
  const daysThisWeek = recentLogs.filter((l) => l.date >= sevenDaysAgoStr).length;

  const hasMedications = activeMedicationsCount > 0;
  const hasReminders = activeRemindersCount > 0;
  const hasLoggedThisWeek = daysThisWeek > 0;

  return {
    profile: profileResult.data,
    todayLog: todayLogResult.data,
    activeMedicationsCount,
    activeRemindersCount,
    daysThisWeek,
    lastLogDate,
    hasMedications,
    hasReminders,
    hasLoggedThisWeek,
    todayStr,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return null;

  const firstName = data.profile?.name?.split(" ")[0];
  const dateLabel = formatDatePt(data.todayStr);
  const heroContext = getHeroContext(data);

  return (
    <div className="space-y-5">
      {/* Hero — saudação + data + contexto emocional */}
      <header className="pb-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
          {dateLabel}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {firstName ? `Olá, ${firstName}` : "Olá"}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {heroContext}
        </p>
      </header>

      {!data.hasMedications ? (
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 anim-delay-75">
          <OnboardingChecklist
            hasMedications={false}
            hasLoggedToday={data.todayLog !== null}
            hasReminders={data.hasReminders}
          />
        </div>
      ) : (
        <>
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 anim-delay-75">
            <TodayCard todayLog={data.todayLog} />
          </div>

          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 anim-delay-150">
            <InsightsStrip
              daysThisWeek={data.daysThisWeek}
              activeMedicationsCount={data.activeMedicationsCount}
              activeRemindersCount={data.activeRemindersCount}
            />
          </div>

          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 anim-delay-225">
            <GuidanceCard
              hasMedications={data.hasMedications}
              hasReminders={data.hasReminders}
              hasLoggedThisWeek={data.hasLoggedThisWeek}
            />
          </div>

          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 anim-delay-300">
            <RecentActivity
              lastLogDate={data.lastLogDate}
              todayStr={data.todayStr}
            />
          </div>
        </>
      )}

      {/* Link para perfil */}
      <Link
        href="/profile"
        className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 transition-all duration-200 hover:shadow-card active:scale-[0.99] animate-in fade-in-0 slide-in-from-bottom-2 anim-delay-300"
        style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        aria-label={`Perfil de ${data.profile?.name ?? "usuário"}`}
      >
        <div>
          <p className="text-sm font-semibold text-foreground">Perfil</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.profile?.name ?? "Suas informações"}
          </p>
        </div>
        <span className="text-xl leading-none text-muted-foreground/50" aria-hidden="true">
          ›
        </span>
      </Link>
    </div>
  );
}
