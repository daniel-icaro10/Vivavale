// template.tsx re-renderiza a cada navegação — isso ativa a transição de página.
// fade limpo 180ms: presença sem distração.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in-0 duration-[180ms]">
      {children}
    </div>
  );
}
