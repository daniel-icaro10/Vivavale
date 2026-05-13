import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
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
      <PageHeader title="Perfil" description="Suas informações pessoais" />

      <div className="space-y-8">
        {data?.profile ? (
          <ProfileForm
            name={data.profile.name}
            timezone={data.profile.timezone}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar o perfil.
          </div>
        )}

        {/* Notificações */}
        <section
          className="space-y-5 rounded-xl border border-border bg-card px-5 py-5"
          aria-labelledby="notifications-heading"
        >
          <div>
            <h2
              id="notifications-heading"
              className="text-base font-semibold text-foreground"
            >
              Notificações
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Configure como e quando receber seus lembretes.
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <PushToggle />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-4 text-sm font-medium text-foreground">
              Preferências de envio
            </p>
            <NotificationPreferencesForm
              reminders_enabled={data?.notifPrefs?.reminders_enabled ?? true}
              quiet_hours_start={data?.notifPrefs?.quiet_hours_start ?? null}
              quiet_hours_end={data?.notifPrefs?.quiet_hours_end ?? null}
            />
          </div>
        </section>

        <div className="border-t border-border pt-8">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
