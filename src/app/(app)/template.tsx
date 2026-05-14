import { AmbientPullToRefresh } from "@/components/shared/AmbientPullToRefresh";

// template.tsx re-renderiza a cada navegação — ativa a transição de página.
// AmbientPullToRefresh envolve o conteúdo: pull-to-refresh atmosférico em todas as páginas do app.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <AmbientPullToRefresh>
      <div className="animate-in fade-in-0 duration-[180ms]">
        {children}
      </div>
    </AmbientPullToRefresh>
  );
}
