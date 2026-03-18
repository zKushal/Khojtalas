"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "../lib/adminApi";
import { getStoredAdminSession, saveAdminSession } from "../lib/adminAuth";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const session = getStoredAdminSession();
    if (session?.token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password.trim()) { setError("Password is required."); return; }

    setLoading(true);

    try {
      const session = await loginAdmin(email.trim(), password);
      saveAdminSession(session);
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-magenta text-xl font-bold text-black">
          KT
        </div>
        <h1 className="text-2xl font-bold text-white">KhojTalas Admin</h1>
        <p className="mt-1 text-sm text-silver/60">Sign in to manage the platform</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-silver/80">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@khojtalas.com"
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-3 text-sm text-white placeholder-silver/40 transition focus:border-cyan focus:outline-none"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-silver/80">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-3 pr-10 text-sm text-white placeholder-silver/40 transition focus:border-cyan focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-silver/50 transition hover:text-silver"
            >
              {showPw ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-magenta/30 bg-magenta/10 px-4 py-2 text-xs text-magenta">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan to-magenta py-3 text-sm font-bold text-black transition active:scale-95 disabled:opacity-70"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
        <p className="text-[11px] font-semibold text-silver/60">MySQL-backed admin login</p>
        <p className="mt-0.5 text-[11px] text-silver/80">
          Uses active users from the <span className="font-semibold text-white">users</span> table with role <span className="font-semibold text-white">admin</span>.
        </p>
      </div>
    </div>
  );
}
