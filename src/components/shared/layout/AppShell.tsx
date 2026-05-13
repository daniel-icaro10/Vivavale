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
          "flex-1 px-4 py-6",
          "pb-[calc(56px+env(safe-area-inset-bottom))]",
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
