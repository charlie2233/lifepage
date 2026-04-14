"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registerHref = callbackUrl
    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      const nextUrl = res?.url ?? callbackUrl;
      if (nextUrl.startsWith("http")) {
        window.location.href = nextUrl;
      } else {
        router.push(nextUrl);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080e12] flex items-center justify-center px-4">
      {/* Animated background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-orb-float absolute -top-24 left-[10%] h-[28rem] w-[28rem] rounded-full bg-[#79e5d2]/10 blur-[120px]" />
        <div className="animate-orb-float-alt absolute bottom-[10%] right-[8%] h-[24rem] w-[24rem] rounded-full bg-[#8fa9ff]/12 blur-[110px]" />
        <div className="animate-orb-float absolute left-[55%] top-[60%] h-[16rem] w-[16rem] rounded-full bg-[#f3b276]/8 blur-[90px]" style={{ animationDelay: "3s" }} />
      </div>

      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(circle at center, black 35%, transparent 80%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="animate-pulse-glow flex h-9 w-9 items-center justify-center rounded-xl border border-[#79e5d2]/30 bg-[linear-gradient(135deg,rgba(121,229,210,0.9),rgba(207,255,246,0.92))] text-[10px] font-black tracking-[0.22em] text-[#041117]">AP</div>
            <span className="brand-display text-[1.4rem] leading-none tracking-tight text-white">
              Atrak Pages
            </span>
          </Link>
          <p className="mt-3 text-sm text-[#7a8d98]">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-[1.75rem] border border-white/10 p-8"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(14,22,28,0.85)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Subtle corner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#79e5d2]/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#8fa9ff]/8 blur-2xl"
          />

          <form onSubmit={handleSubmit} className="relative space-y-5">
            {error && (
              <div className="lp-fade-rise rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-[#94a2ad]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-fancy"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-[#94a2ad]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-fancy"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lp-button-primary btn-fancy mt-2 w-full py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#041117]/30 border-t-[#041117]" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="neon-divider my-2" />

            <p className="text-center text-sm text-[#6e7e89]">
              Don&apos;t have an account?{" "}
              <Link
                href={registerHref}
                className="font-medium text-[#79e5d2] transition-colors hover:text-[#cffff6]"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#4e5e68]">
          Built by{" "}
          <a
            href="https://atrak.dev"
            className="text-[#79e5d2]/60 transition-colors hover:text-[#79e5d2]"
            target="_blank"
            rel="noopener noreferrer"
          >
            atrak.dev
          </a>
        </p>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080e12] flex items-center justify-center px-4">
      <div className="text-sm text-[#7a8d98]">Loading sign in…</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
