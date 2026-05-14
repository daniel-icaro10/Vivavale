"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Activity, Pill, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",   label: "Início",    icon: Home },
  { href: "/daily",       label: "Registrar", icon: ClipboardList },
  { href: "/timeline",    label: "Evolução",  icon: Activity },
  { href: "/medications", label: "Remédios",  icon: Pill },
  { href: "/reminders",   label: "Lembretes", icon: Bell },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/96 backdrop-blur border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0 -1px 0 oklch(0 0 0 / 0.03), 0 -4px 20px oklch(0 0 0 / 0.04)" }}
    >
      <ul className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] tracking-wide transition-colors duration-150",
                  "min-h-[64px] touch-manipulation",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground/60 font-medium hover:text-muted-foreground",
                )}
              >
                {/* Indicador ativo: pequeno traço premium acima do ícone */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-primary/80"
                  />
                )}
                <span
                  className={cn(
                    "flex items-center justify-center transition-all duration-200 ease-out",
                    isActive && "-translate-y-px",
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.1 : 1.6}
                    aria-hidden="true"
                  />
                </span>
                <span className={cn("transition-colors duration-150", !isActive && "opacity-60")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
