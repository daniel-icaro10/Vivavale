// Widths in px match the actual label lengths: Dor, Fadiga, Sono, Humor, Ansiedade
const SLIDER_LABEL_WIDTHS = [28, 48, 36, 48, 72];

export default function DailyLoading() {
  return (
    <div role="status" className="space-y-8">
      <p className="sr-only">Carregando registro diário...</p>

      <div aria-hidden="true" className="animate-pulse space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-4 w-36 rounded-md bg-muted" />
          <div className="h-7 w-52 rounded-md bg-muted" />
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {SLIDER_LABEL_WIDTHS.map((labelWidth, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="h-4 rounded bg-muted" style={{ width: labelWidth }} />
                  <div className="h-3 w-40 rounded bg-muted" />
                </div>
                <div className="h-6 w-6 shrink-0 rounded bg-muted" />
              </div>
              <div className="h-11 w-full rounded-lg bg-muted" />
            </div>
          ))}
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <div>
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-1 h-3 w-52 rounded bg-muted" />
          </div>
          <div className="h-28 w-full rounded-lg bg-muted" />
        </div>

        {/* Save indicator + button */}
        <div className="space-y-3">
          <div className="min-h-10" />
          <div className="h-11 w-full rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
