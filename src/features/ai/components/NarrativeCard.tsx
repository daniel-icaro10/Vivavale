import { AIInsightBadge } from "./AIInsightBadge";

interface NarrativeCardProps {
  text: string;
  isAI: boolean;
}

export function NarrativeCard({ text, isAI }: NarrativeCardProps) {
  return (
    <div
      role="note"
      aria-label="Narrativa da semana"
      className="rounded-2xl bg-card px-6 pt-5 pb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      style={{
        borderTop: "2px solid oklch(0.540 0.138 277 / 0.12)",
        borderLeft: "1px solid oklch(0.940 0.007 85)",
        borderRight: "1px solid oklch(0.940 0.007 85)",
        borderBottom: "1px solid oklch(0.940 0.007 85)",
      }}
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
        Esta semana
      </p>
      <p className="text-[15px] leading-7 text-foreground/85 max-w-reading">{text}</p>
      {isAI && (
        <div className="mt-4 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
