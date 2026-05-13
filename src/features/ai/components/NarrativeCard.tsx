import { AIInsightBadge } from "./AIInsightBadge";

interface NarrativeCardProps {
  text: string;
  isAI: boolean;
}

export function NarrativeCard({ text, isAI }: NarrativeCardProps) {
  return (
    <div
      className="rounded-2xl bg-card px-6 py-6 shadow-card"
      style={{ border: "1px solid oklch(0.928 0.010 85)" }}
      role="note"
      aria-label="Narrativa da semana"
    >
      <p className="text-base leading-relaxed text-foreground">{text}</p>
      {isAI && (
        <div className="mt-4 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
