import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// Rotas de autenticação: públicas, mas usuários autenticados são redirecionados para /dashboard.
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/auth/callback",
];

// Rotas abertas: públicas e acessíveis mesmo para usuários autenticados (sem redirect para /dashboard).
const OPEN_ROUTES = ["/", "/analyze", "/results"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() verifica o token com o servidor de auth — mais seguro que getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isOpenRoute = OPEN_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "?") || pathname.startsWith(r + "/"),
  );

  // Não autenticado tentando acessar rota protegida → /login
  if (!user && !isAuthRoute && !isOpenRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Autenticado tentando acessar rotas de auth (exceto callback) → /dashboard
  if (user && isAuthRoute && pathname !== "/auth/callback") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rotas abertas: qualquer usuário (autenticado ou não) pode acessar livremente.
  return response;
}

export const config = {
  matcher: [
    // Executa em todas as rotas exceto assets estáticos, imagens, favicon, manifest e sw.js
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
