import { redirect } from "next/navigation";

// O middleware já verifica autenticação e redireciona não-autenticados para /login.
// Usuários autenticados que chegam aqui vão direto para /dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
