import { AIInsightBadge } from "./AIInsightBadge";

interface ReflectionCardProps {
  text: string;
  isAI: boolean;
}

export function ReflectionCard({ text, isAI }: ReflectionCardProps) {
  return (
    <div
      className="rounded-2xl px-7 pt-10 pb-12 animate-in fade-in-0 duration-300"
      style={{ background: "oklch(0.975 0.009 80)" }}
      role="note"
      aria-label="Reflexão sobre seus registros"
    >
      <p className="vl-narrative max-w-reading">{text}</p>
      {isAI && (
        <div className="mt-6 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
