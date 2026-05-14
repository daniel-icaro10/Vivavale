import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { ExportDataButton } from "@/features/profile/components/ExportDataButton";
import { DeleteAccountSection } from "@/features/profile/components/DeleteAccountSection";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { PushToggle } from "@/features/notifications/components/PushToggle";
import { NotificationPreferencesForm } from "@/features/notifications/components/NotificationPreferencesForm";

export const metadata: Metadata = {
  title: "Perfil",
};

async function getPageData() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: notifPrefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, timezone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notification_preferences")
      .select("reminders_enabled, quiet_hours_start, quiet_hours_end")
      .eq("user_id", user.id)
      .single(),
  ]);

  return { profile, notifPrefs };
}

export default async function ProfilePage() {
  const data = await getPageData();

  return (
    <>
      <PageHeader title="Perfil" />

      <p
        className="mb-10 -mt-2 text-[15px] leading-[1.85] text-muted-foreground/55 max-w-reading"
        style={{ letterSpacing: "-0.004em" }}
      >
        Suas informações, no seu ritmo.
      </p>

      <div className="space-y-10">
        {/* Informações pessoais */}
        {data?.profile ? (
          <section aria-label="Informações pessoais">
            <p className="vl-eyebrow mb-4">Sobre você</p>
            <ProfileForm
              name={data.profile.name}
              timezone={data.profile.timezone}
            />
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o perfil.
          </p>
        )}

        <div className="vl-hairline" />

        {/* Lembretes */}
        <section aria-labelledby="notifications-heading" className="space-y-5">
          <div>
            <p className="vl-eyebrow mb-1" id="notifications-heading">
              Lembretes
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground/75">
              Configure quando quer ser lembrado de registrar.
            </p>
          </div>
          <PushToggle />
          <div className="h-px bg-border/40" />
          <NotificationPreferencesForm
            reminders_enabled={data?.notifPrefs?.reminders_enabled ?? true}
            quiet_hours_start={data?.notifPrefs?.quiet_hours_start ?? null}
            quiet_hours_end={data?.notifPrefs?.quiet_hours_end ?? null}
          />
        </section>

        <div className="vl-hairline" />

        {/* Dados pessoais — LGPD */}
        <section aria-labelledby="data-heading" className="space-y-5">
          <div>
            <p className="vl-eyebrow mb-1" id="data-heading">
              Seus dados
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground/75">
              Tudo que você registrou pertence a você.
            </p>
          </div>
          <ExportDataButton />
          <DeleteAccountSection />
        </section>

        <div className="vl-hairline" />

        <LogoutButton />
      </div>
    </>
  );
}
