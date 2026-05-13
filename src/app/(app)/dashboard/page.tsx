import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { OnboardingChecklist } from "@/features/dashboard/components/OnboardingChecklist";
import { TodayCard } from "@/features/dashboard/components/TodayCard";
import { InsightsStrip } from "@/features/dashboard/components/InsightsStrip";
import { GuidanceCard } from "@/features/dashboard/components/GuidanceCard";
import { RecentActivity } from "@/features/dashboard/components/RecentActivity";

export const metadata: Metadata = {
  title: "Início",
};

const WEEKDAYS_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

function formatDatePt(todayStr: string): string {
  const [yearStr, monthStr, dayStr] = todayStr.split("-");
  const date = new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
  );
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

  // Janela de 7 dias: inclui hoje (D-6 a hoje = 7 dias)
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

    // Últimos 10 registros para calcular: dias esta semana + data do último log
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
  const daysThisWeek = recentLogs.filter(
    (l) => l.date >= sevenDaysAgoStr,
  ).length;

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
  const title = firstName ? `Olá, ${firstName}` : "Olá";
  const subtitle = formatDatePt(data.todayStr);

  return (
    <>
      <PageHeader title={title} description={subtitle} />

      <div className="space-y-3">
        {!data.hasMedications ? (
          // Usuário novo: checklist de onboarding
          <OnboardingChecklist
            hasMedications={false}
            hasLoggedToday={data.todayLog !== null}
            hasReminders={data.hasReminders}
          />
        ) : (
          // Usuário ativo: dashboard completo
          <>
            <TodayCard todayLog={data.todayLog} />

            <InsightsStrip
              daysThisWeek={data.daysThisWeek}
              activeMedicationsCount={data.activeMedicationsCount}
              activeRemindersCount={data.activeRemindersCount}
            />

            <GuidanceCard
              hasMedications={data.hasMedications}
              hasReminders={data.hasReminders}
              hasLoggedThisWeek={data.hasLoggedThisWeek}
            />

            <RecentActivity
              lastLogDate={data.lastLogDate}
              todayStr={data.todayStr}
            />
          </>
        )}

        {/* Link para perfil — sempre visível */}
        <Link
          href="/profile"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-muted/50 active:bg-muted"
          aria-label={`Perfil de ${data.profile?.name ?? "usuário"}`}
        >
          <div>
            <p className="text-sm font-semibold text-foreground">Perfil</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data.profile?.name ?? "Suas informações"}
            </p>
          </div>
          <span className="text-lg leading-none text-muted-foreground" aria-hidden="true">
            ›
          </span>
        </Link>
      </div>
    </>
  );
}
