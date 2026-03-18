"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
      </svg>
    ),
  },
  {
    label: "Explore",
    href: "/explore",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    label: "Report",
    isPrimary: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    label: "Matches",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6.5h16v10H8l-4 4v-14Z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 20c1.5-3.5 4-5.25 7-5.25S17.5 16.5 19 20" />
      </svg>
    ),
  },
];

export default function MainNavigation({
  onReportClick,
  onProfileClick,
}: {
  onReportClick?: () => void;
  onProfileClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-3xl border border-white/10 bg-onyx/95 px-3 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
        {navItems.map((item) => {
          if (item.isPrimary) {
            return (
              <button
                key={item.label}
                onClick={onReportClick}
                className="flex h-14 w-14 -translate-y-5 items-center justify-center rounded-2xl bg-gradient-to-b from-cyan to-magenta text-white shadow-[0_12px_30px_rgba(255,0,80,0.35)]"
                aria-label={item.label}
              >
                {item.icon}
              </button>
            );
          }

          const isActive = item.href ? pathname === item.href : false;
          const sharedClass = `flex min-w-[56px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
            isActive ? "bg-cyan/15 text-cyan" : "text-white/80 hover:bg-white/5 hover:text-white"
          }`;

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={sharedClass} aria-label={item.label}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              className={sharedClass}
              aria-label={item.label}
              onClick={item.label === "Profile" ? onProfileClick : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
