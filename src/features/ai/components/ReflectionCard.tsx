import { AIInsightBadge } from "./AIInsightBadge";

interface ReflectionCardProps {
  text: string;
  isAI: boolean;
}

export function ReflectionCard({ text, isAI }: ReflectionCardProps) {
  return (
    <div
      className="rounded-2xl px-6 pt-5 pb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      style={{ background: "oklch(0.975 0.009 80)" }}
      role="note"
      aria-label="Reflexão sobre seus registros"
    >
      <p className="mb-3 vl-eyebrow">Observação</p>
      <p className="vl-narrative max-w-reading">{text}</p>
      {isAI && (
        <div className="mt-4 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
