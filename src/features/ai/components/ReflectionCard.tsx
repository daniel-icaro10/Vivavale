import { AIInsightBadge } from "./AIInsightBadge";

interface ReflectionCardProps {
  text: string;
  isAI: boolean;
}

export function ReflectionCard({ text, isAI }: ReflectionCardProps) {
  return (
    <div
      className="rounded-2xl px-5 py-5"
      style={{
        background: "oklch(0.968 0.008 80)",
        border: "1px dashed oklch(0.880 0.015 85)",
      }}
      role="note"
      aria-label="Reflexão sobre seus registros"
    >
      <p className="text-[15px] leading-7 text-muted-foreground/80 max-w-reading">{text}</p>
      {isAI && (
        <div className="mt-3 flex justify-end">
          <AIInsightBadge />
        </div>
      )}
    </div>
  );
}
