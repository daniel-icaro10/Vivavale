import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <main
        className={cn(
          "flex-1 px-5 pt-7 pb-[calc(68px+env(safe-area-inset-bottom))]",
          "max-w-lg mx-auto w-full",
          className,
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
