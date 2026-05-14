import { BottomNav } from "./BottomNav";
import { AtmosphereProvider, type UserPresence } from "@/features/dashboard/components/AtmosphereProvider";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  presence?: UserPresence;
};

export function AppShell({ children, className, presence }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AtmosphereProvider presence={presence} />
      <main
        className={cn(
          "flex-1 px-5 pt-8 pb-[calc(72px+env(safe-area-inset-bottom))]",
          "max-w-lg mx-auto w-full",
          "overscroll-y-contain",
          className,
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
