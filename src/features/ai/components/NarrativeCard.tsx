import { AIInsightBadge } from "./AIInsightBadge";

interface NarrativeCardProps {
  text: string;
  isAI: boolean;
  bleed?: boolean;
}

// bleed=true → seção editorial full-width (parent precisa usar -mx-5)
// bleed=false → card com cantos arredondados
export function NarrativeCard({ text, isAI, bleed = false }: NarrativeCardProps) {
  return (
    <div
      role="note"
      aria-label="Narrativa da semana"
      className={`animate-in fade-in-0 duration-300 ${
        bleed ? "px-5 py-10" : "rounded-2xl px-6 pt-6 pb-8"
      }`}
      style={
        bleed
          ? {
              background: "oklch(0.982 0.009 82)",
              borderTop: "1px solid oklch(0.944 0.007 82)",
              borderBottom: "1px solid oklch(0.944 0.007 82)",
            }
          : {
              background: "oklch(0.982 0.009 82)",
              border: "1px solid oklch(0.944 0.007 82)",
            }
      }
    >
      <p className="mb-3 vl-eyebrow">Esta semana</p>
      <p className="vl-narrative max-w-reading">{text}</p>
      {isAI && (
        <div className="mt-4 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
