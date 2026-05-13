import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-5 py-16 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
        className,
      )}
    >
      {icon && (
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "oklch(0.968 0.008 80)" }}
          aria-hidden="true"
        >
          <span className="text-2xl leading-none text-muted-foreground/50">{icon}</span>
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
