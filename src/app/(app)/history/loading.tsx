function SkeletonCard({ hasNotes }: { hasNotes: boolean }) {
  return (
    <div className="py-4">
      <div className="flex items-baseline gap-2.5 mb-2.5">
        <div className="h-2 w-7 rounded-full vl-shimmer" />
        <div className="h-4 w-32 rounded vl-shimmer" style={{ animationDelay: "30ms" }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {[28, 38, 30, 34, 50].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded vl-shimmer"
            style={{ width: w, animationDelay: `${i * 20}ms` }}
          />
        ))}
      </div>
      {hasNotes && (
        <div
          className="mt-3 pl-4"
          style={{ borderLeft: "2px solid oklch(0.540 0.138 277 / 0.08)" }}
        >
          <div className="h-3 w-3/4 rounded vl-shimmer" />
        </div>
      )}
    </div>
  );
}

function SkeletonGroup({
  headerWidth,
  cards,
}: {
  headerWidth: number;
  cards: boolean[];
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <div className="h-2 rounded-full vl-shimmer shrink-0" style={{ width: headerWidth }} />
        <div className="h-px flex-1 bg-border/50" aria-hidden="true" />
      </div>
      <div className="divide-y divide-border/30">
        {cards.map((hasNotes, i) => (
          <SkeletonCard key={i} hasNotes={hasNotes} />
        ))}
      </div>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div role="status" aria-label="Carregando histórico">
      <p className="sr-only">Carregando...</p>

      <div aria-hidden="true">
        <div className="mb-8 space-y-2">
          <div className="h-2.5 w-24 rounded-full vl-shimmer" />
          <div className="h-7 w-24 rounded-lg vl-shimmer" style={{ animationDelay: "60ms" }} />
        </div>

        <div className="space-y-10">
          <SkeletonGroup headerWidth={72} cards={[true, true, false]} />
          <SkeletonGroup headerWidth={80} cards={[true, false]} />
        </div>
      </div>
    </div>
  );
}
