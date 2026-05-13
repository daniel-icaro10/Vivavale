import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login`);
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
