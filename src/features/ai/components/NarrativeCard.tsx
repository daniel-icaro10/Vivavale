import { AIInsightBadge } from "./AIInsightBadge";

interface NarrativeCardProps {
  text: string;
  isAI: boolean;
}

export function NarrativeCard({ text, isAI }: NarrativeCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-muted/20 px-4 py-4"
      role="note"
      aria-label="Narrativa da semana"
    >
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
      {isAI && (
        <div className="mt-2.5 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
