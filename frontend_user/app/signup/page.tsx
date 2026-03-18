"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isInitializing } = useAuth();
  const [nextPath, setNextPath] = useState("/");
  const [intent, setIntent] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");

    if (!name.trim()) return setError("Full name is required.");
    if (!email.trim()) return setError("Email is required.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);

    try {
      const message = await signup({
        fullName: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccess(message);
      const query = new URLSearchParams({ next: nextPath });
      if (intent) query.set("intent", intent);

      window.setTimeout(() => {
        router.replace(`/login?${query.toString()}`);
      }, 900);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to register user."));
      setLoading(false);
      return;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
        <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-cyan/70">KhojTalas</p>
        <h1 className="text-2xl font-bold">Create User Account</h1>
        <p className="mt-1 text-sm text-silver/75">Sign up to report lost/found items securely.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-3 text-sm text-white placeholder:text-silver/55 focus:border-cyan focus:outline-none"
          />
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
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            type="password"
            className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-3 text-sm text-white placeholder:text-silver/55 focus:border-cyan focus:outline-none"
          />

          {error ? (
            <div className="rounded-xl border border-magenta/30 bg-magenta/10 px-3 py-2 text-xs text-magenta">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs text-cyan">
              {success} Redirecting to login...
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan to-magenta py-3 text-sm font-bold text-black transition disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-silver/75">
          Already registered?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}${intent ? `&intent=${encodeURIComponent(intent)}` : ""}`}
            replace
            className="font-semibold text-cyan"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
