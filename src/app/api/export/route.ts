import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const allowed = await checkRateLimit("export_data", user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde alguns minutos antes de exportar novamente." },
      { status: 429 },
    );
  }

  const [profileRes, logsRes, medsRes, remindersRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date"),
    supabase.from("medications").select("*").eq("user_id", user.id),
    supabase
      .from("reminders")
      .select("id, medication_id, time_local, recurrence, active, created_at")
      .eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    profile: profileRes.data ?? null,
    daily_logs: logsRes.data ?? [],
    medications: medsRes.data ?? [],
    reminders: remindersRes.data ?? [],
  };

  const filename = `vivaleve-dados-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
