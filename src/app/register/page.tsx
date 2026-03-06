"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080e12] flex items-center justify-center px-4 py-12">
      {/* Animated background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-orb-float absolute -top-20 right-[12%] h-[26rem] w-[26rem] rounded-full bg-[#8fa9ff]/12 blur-[110px]" />
        <div className="animate-orb-float-alt absolute bottom-[8%] left-[6%] h-[22rem] w-[22rem] rounded-full bg-[#79e5d2]/10 blur-[100px]" />
        <div className="animate-orb-float absolute left-[60%] top-[50%] h-[14rem] w-[14rem] rounded-full bg-[#f3b276]/8 blur-[80px]" style={{ animationDelay: "2.5s" }} />
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
            <div className="animate-pulse-glow flex h-9 w-9 items-center justify-center rounded-xl border border-[#79e5d2]/30 bg-[linear-gradient(135deg,rgba(121,229,210,0.9),rgba(207,255,246,0.92))] text-[10px] font-black tracking-[0.22em] text-[#041117]">
              LP
            </div>
            <span className="brand-display text-[1.4rem] leading-none tracking-tight text-white">
              LifePage
            </span>
          </Link>
          <p className="mt-3 text-sm text-[#7a8d98]">
            Create your free account
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
            className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#8fa9ff]/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[#79e5d2]/8 blur-2xl"
          />

          <form onSubmit={handleSubmit} className="relative space-y-4">
            {error && (
              <div className="lp-fade-rise rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {(
              [
                {
                  label: "Full Name",
                  key: "name",
                  type: "text",
                  placeholder: "Your Name",
                },
                {
                  label: "Username",
                  key: "username",
                  type: "text",
                  placeholder: "yourhandle",
                },
                {
                  label: "Email",
                  key: "email",
                  type: "email",
                  placeholder: "you@example.com",
                },
                {
                  label: "Password",
                  key: "password",
                  type: "password",
                  placeholder: "••••••••",
                },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-[#94a2ad]">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required
                  className="input-fancy"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="lp-button-primary btn-fancy mt-2 w-full py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#041117]/30 border-t-[#041117]" />
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="neon-divider my-2" />

            <p className="text-center text-sm text-[#6e7e89]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#79e5d2] transition-colors hover:text-[#cffff6]"
              >
                Sign in
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
