import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { OnboardingChecklist } from "@/features/dashboard/components/OnboardingChecklist";
import { TodayCard } from "@/features/dashboard/components/TodayCard";
import { InsightsStrip } from "@/features/dashboard/components/InsightsStrip";
import { GuidanceCard } from "@/features/dashboard/components/GuidanceCard";
import { RecentActivity } from "@/features/dashboard/components/RecentActivity";
import { AtmosphereHero } from "@/features/dashboard/components/AtmosphereHero";
import { getEmotionalPresence } from "@/features/dashboard/utils/getEmotionalPresence";

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

// ─── Types ────────────────────────────────────────────────
type DashboardMode =
  | "onboarding"     // sem medicamentos — primeiro acesso
  | "recovery"       // retornando após 5+ dias de ausência
  | "encouragement"  // tem medicamentos mas ainda não registrou esta semana
  | "continuity"     // streak ativa — logou hoje e 4+ dias
  | "reflection";    // estado padrão — alguns dados, rotina em andamento

type DashboardData = NonNullable<Awaited<ReturnType<typeof getDashboardData>>>;

// ─── Ambient state ────────────────────────────────────────
type AmbientState = "sparse" | "recovering" | "stable" | "calm" | "reflective";

function getAmbientState(mode: DashboardMode): AmbientState {
  switch (mode) {
    case "onboarding":    return "sparse";
    case "recovery":      return "recovering";
    case "continuity":    return "stable";
    case "encouragement": return "calm";
    case "reflection":    return "reflective";
  }
}

function enterDuration(ambient: AmbientState): string {
  return ambient === "recovering" ? "duration-300" : "duration-200";
}

// ─── Adaptive mode ────────────────────────────────────────
function getDashboardMode(data: DashboardData): DashboardMode {
  const { hasMedications, todayLog, daysThisWeek, daysSinceLastLog } = data;

  if (!hasMedications) return "onboarding";
  if (daysSinceLastLog !== null && daysSinceLastLog >= 5) return "recovery";
  if (daysThisWeek === 0) return "encouragement";
  if (todayLog && daysThisWeek >= 4) return "continuity";

  return "reflection";
}

// ─── Next likely action ───────────────────────────────────
type NextAction = "log_today" | "review_week" | "manage_reminders" | "reflect";

function getNextLikelyAction(data: DashboardData, mode: DashboardMode): NextAction {
  if (!data.todayLog && mode !== "onboarding") return "log_today";
  if (data.hasMedications && !data.hasReminders) return "manage_reminders";
  if (data.todayLog && data.daysThisWeek >= 3) return "review_week";
  return "reflect";
}

// ─── Date helpers ─────────────────────────────────────────
function formatDatePt(todayStr: string): string {
  const [yearStr, monthStr, dayStr] = todayStr.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  const weekday = WEEKDAYS_PT[date.getDay()];
  const month = MONTHS_PT[Number(monthStr) - 1];
  return `${weekday}, ${Number(dayStr)} de ${month}`;
}

// ─── Data fetching ────────────────────────────────────────
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
  const totalLogsProxy = recentLogs.length; // 0-10 proxy; 10 = "10 ou mais"

  const daysSinceLastLog = lastLogDate
    ? Math.floor(
        (new Date(todayStr).getTime() - new Date(lastLogDate).getTime()) / 86_400_000,
      )
    : null;

  return {
    profile: profileResult.data,
    todayLog: todayLogResult.data,
    activeMedicationsCount,
    activeRemindersCount,
    daysThisWeek,
    lastLogDate,
    daysSinceLastLog,
    totalLogsProxy,
    hasMedications: activeMedicationsCount > 0,
    hasReminders: activeRemindersCount > 0,
    hasLoggedThisWeek: daysThisWeek > 0,
    todayStr,
  };
}

// ─── Page ─────────────────────────────────────────────────
export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return null;

  const mode = getDashboardMode(data);
  const ambient = getAmbientState(mode);
  const dur = enterDuration(ambient);
  const nextAction = getNextLikelyAction(data, mode);
  const firstName = data.profile?.name?.split(" ")[0];
  const dateLabel = formatDatePt(data.todayStr);

  // Presença emocional — substitui getContinuityContext
  const contextMessage = getEmotionalPresence({
    daysSinceLastLog: data.daysSinceLastLog,
    totalLogs: data.totalLogsProxy,
    daysThisWeek: data.daysThisWeek,
    hasLoggedToday: data.todayLog !== null,
  }).phrase;

  return (
    <div className="space-y-6">
      {/* Hero — contextual + atmosphere-aware (client) */}
      <AtmosphereHero
        contextMessage={contextMessage}
        dur={dur}
        dateLabel={dateLabel}
        firstName={firstName}
        nextAction={nextAction}
        hasLoggedToday={data.todayLog !== null}
      />

      {/* ── Onboarding ────────────────────────────────────── */}
      {mode === "onboarding" && (
        <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-75`}>
          <OnboardingChecklist
            hasMedications={false}
            hasLoggedToday={data.todayLog !== null}
            hasReminders={data.hasReminders}
          />
        </div>
      )}

      {/* ── Recovery: foco no reconectar ──────────────────── */}
      {mode === "recovery" && (
        <>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-75`}>
            <TodayCard todayLog={data.todayLog} />
          </div>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-150`}>
            <GuidanceCard
              hasMedications={data.hasMedications}
              hasReminders={data.hasReminders}
              hasLoggedThisWeek={data.hasLoggedThisWeek}
            />
          </div>
        </>
      )}

      {/* ── Encouragement: foco no primeiro registro ──────── */}
      {mode === "encouragement" && (
        <>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-75`}>
            <TodayCard todayLog={data.todayLog} />
          </div>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-150`}>
            <GuidanceCard
              hasMedications={data.hasMedications}
              hasReminders={data.hasReminders}
              hasLoggedThisWeek={data.hasLoggedThisWeek}
            />
          </div>
        </>
      )}

      {/* ── Continuity: streak — InsightsStrip em destaque ── */}
      {mode === "continuity" && (
        <>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-75`}>
            <InsightsStrip
              daysThisWeek={data.daysThisWeek}
              activeMedicationsCount={data.activeMedicationsCount}
              activeRemindersCount={data.activeRemindersCount}
            />
          </div>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-150`}>
            <TodayCard todayLog={data.todayLog} />
          </div>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-225`}>
            <GuidanceCard
              hasMedications={data.hasMedications}
              hasReminders={data.hasReminders}
              hasLoggedThisWeek={data.hasLoggedThisWeek}
            />
          </div>
        </>
      )}

      {/* ── Reflection: ordem padrão ──────────────────────── */}
      {mode === "reflection" && (
        <>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-75`}>
            <TodayCard todayLog={data.todayLog} />
          </div>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-150`}>
            <InsightsStrip
              daysThisWeek={data.daysThisWeek}
              activeMedicationsCount={data.activeMedicationsCount}
              activeRemindersCount={data.activeRemindersCount}
            />
          </div>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-225`}>
            <GuidanceCard
              hasMedications={data.hasMedications}
              hasReminders={data.hasReminders}
              hasLoggedThisWeek={data.hasLoggedThisWeek}
            />
          </div>
          <div className={`animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-300`}>
            <RecentActivity
              lastLogDate={data.lastLogDate}
              todayStr={data.todayStr}
            />
          </div>
        </>
      )}

      {/* Perfil */}
      <Link
        href="/profile"
        className={`flex items-center justify-between rounded-2xl bg-card px-5 py-4 float-hover active:scale-[0.985] animate-in fade-in-0 slide-in-from-bottom-2 ${dur} anim-delay-375`}
        style={{ border: "1px solid oklch(0.940 0.007 85)" }}
        aria-label={`Perfil de ${data.profile?.name ?? "usuário"}`}
      >
        <div>
          <p className="text-sm font-semibold text-foreground">Perfil</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.profile?.name ?? "Suas informações"}
          </p>
        </div>
        <span className="text-xl leading-none text-muted-foreground/40" aria-hidden="true">
          ›
        </span>
      </Link>
    </div>
  );
}
