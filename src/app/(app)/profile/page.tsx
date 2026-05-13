import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export const metadata: Metadata = {
  title: "Perfil",
};

async function getProfile() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("name, timezone")
    .eq("id", user.id)
    .single();

  return data;
}

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <>
      <PageHeader title="Perfil" description="Suas informações pessoais" />

      <div className="space-y-8">
        {profile ? (
          <ProfileForm name={profile.name} timezone={profile.timezone} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar o perfil.
          </div>
        )}

        <div className="border-t border-border pt-8">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
