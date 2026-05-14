import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getEmptyStateTone } from "@/features/shared/utils/getEmptyStateTone";

interface TimelineEmptyStateProps {
  totalLogs?: number;
  daysSinceLastLog?: number | null;
  currentWeekCount?: number;
}

export function TimelineEmptyState({
  totalLogs = 0,
  daysSinceLastLog = null,
  currentWeekCount = 0,
}: TimelineEmptyStateProps) {
  const tone = getEmptyStateTone({ totalLogs, daysSinceLastLog, currentWeekCount });

  return (
    <div className="flex flex-col items-center px-5 py-20 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "oklch(0.968 0.008 80)" }}
        aria-hidden="true"
      >
        <span className="text-2xl leading-none text-muted-foreground/50">◎</span>
      </div>
      <p className="text-base font-semibold text-foreground">{tone.title}</p>
      <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
        {tone.description}
      </p>
      <Link
        href="/daily"
        className={cn(buttonVariants(), "mt-6 h-10 px-5 text-sm")}
      >
        Fazer primeiro registro
      </Link>
    </div>
  );
}
