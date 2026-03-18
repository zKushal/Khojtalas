"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getStoredAdminSession } from "../lib/adminAuth";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pending": "Pending Reports",
  "/verified": "Verified Items",
  "/users": "User Management",
};

export default function TopBar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Admin Panel";
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const session = getStoredAdminSession();
    if (session?.adminName) {
      setAdminName(session.adminName);
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-obsidian/95 px-6 py-4 backdrop-blur-xl">
      <h1 className="text-lg font-bold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-magenta text-[9px] font-bold text-white">
            2
          </span>
        </button>

        {/* Admin badge */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-magenta text-xs font-bold text-black">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-white">{adminName}</span>
        </div>
      </div>
    </header>
  );
}
