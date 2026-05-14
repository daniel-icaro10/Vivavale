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
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/96 backdrop-blur border-t border-border/40 pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0 -1px 0 oklch(0 0 0 / 0.02), 0 -4px 20px oklch(0 0 0 / 0.03)" }}
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
                  "relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] tracking-wide transition-colors duration-200",
                  "min-h-[64px] touch-manipulation",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground/55 font-medium hover:text-muted-foreground",
                )}
              >
                {/* Indicador ativo — transição suave de largura */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-primary/75 transition-all duration-300 ease-out",
                    isActive ? "w-5 opacity-100" : "w-0 opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center justify-center transition-transform duration-200 ease-out",
                    isActive && "-translate-y-px",
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.1 : 1.6}
                    aria-hidden="true"
                  />
                </span>
                <span className={cn("transition-colors duration-200", !isActive && "opacity-55")}>
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
