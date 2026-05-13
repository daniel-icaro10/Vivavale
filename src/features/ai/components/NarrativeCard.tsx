import { AIInsightBadge } from "./AIInsightBadge";

interface NarrativeCardProps {
  text: string;
  isAI: boolean;
}

export function NarrativeCard({ text, isAI }: NarrativeCardProps) {
  return (
    <div
      className="rounded-2xl bg-card px-6 py-6 shadow-card animate-in fade-in-0 slide-in-from-bottom-2 duration-200 float-hover"
      style={{ border: "1px solid oklch(0.928 0.010 85)" }}
      role="note"
      aria-label="Narrativa da semana"
    >
      <p className="text-[15px] leading-7 text-foreground/90 max-w-reading">{text}</p>
      {isAI && (
        <div className="mt-4 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
