import { AIInsightBadge } from "./AIInsightBadge";

interface ReflectionCardProps {
  text: string;
  isAI: boolean;
}

export function ReflectionCard({ text, isAI }: ReflectionCardProps) {
  return (
    <div
      className="rounded-xl border border-dashed border-border px-4 py-3.5"
      role="note"
      aria-label="Reflexão sobre seus registros"
    >
      <p className="text-sm italic leading-relaxed text-muted-foreground">{text}</p>
      {isAI && (
        <div className="mt-2 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
