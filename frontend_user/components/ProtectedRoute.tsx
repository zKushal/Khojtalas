"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-cyan" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
