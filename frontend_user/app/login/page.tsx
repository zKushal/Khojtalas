"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../lib/api";

function withOpenReport(path: string) {
  return path.includes("?") ? `${path}&openReport=1` : `${path}?openReport=1`;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isInitializing } = useAuth();
  const [nextPath, setNextPath] = useState("/");
  const [intent, setIntent] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/";
    setNextPath(next.startsWith("/") ? next : "/");
    setIntent(params.get("intent") || "");
  }, []);

  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;
    router.replace(nextPath);
  }, [isAuthenticated, isInitializing, nextPath, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      const destination =
        intent === "report"
          ? withOpenReport(nextPath)
          : intent === "profile"
            ? "/profile"
            : nextPath;

      router.replace(destination);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to login user."));
      setLoading(false);
      return;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
        <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-cyan/70">KhojTalas</p>
        <h1 className="text-2xl font-bold">User Login</h1>
        <p className="mt-1 text-sm text-silver/75">Log in to access secure report submission.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-3 text-sm text-white placeholder:text-silver/55 focus:border-cyan focus:outline-none"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-3 text-sm text-white placeholder:text-silver/55 focus:border-cyan focus:outline-none"
          />

          {error ? (
            <div className="rounded-xl border border-magenta/30 bg-magenta/10 px-3 py-2 text-xs text-magenta">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan to-magenta py-3 text-sm font-bold text-black transition disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-silver/75">
          New here?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(nextPath)}${intent ? `&intent=${encodeURIComponent(intent)}` : ""}`}
            replace
            className="font-semibold text-cyan"
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
