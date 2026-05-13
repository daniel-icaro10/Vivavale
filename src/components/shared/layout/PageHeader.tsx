import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-7", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {description && (
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
              {description}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {children && <div className="shrink-0 pt-0.5">{children}</div>}
      </div>
    </header>
  );
}
