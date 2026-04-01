"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Link2, Search, Sparkles } from "lucide-react";
import { TrackPageView } from "@/components/track-page-view";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl");
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(true);
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
      router.push(loginHref);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080e12] px-4 py-10 lg:px-8">
      <TrackPageView event="signup_page_viewed" />
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

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="animate-pulse-glow flex h-9 w-9 items-center justify-center rounded-xl border border-[#79e5d2]/30 bg-[linear-gradient(135deg,rgba(121,229,210,0.9),rgba(207,255,246,0.92))] text-[10px] font-black tracking-[0.22em] text-[#041117]">AP</div>
            <span className="brand-display text-[1.4rem] leading-none tracking-tight text-white">
              Atrak Pages
            </span>
          </Link>

          <div className="mt-8 max-w-2xl">
            <div className="lp-chip inline-flex px-4 py-2 text-sm">
              Free to start
            </div>
            <h1 className="brand-display mt-6 text-[3.6rem] leading-[0.96] tracking-[-0.05em] text-white">
              Create the page,
              <span className="block text-[#79e5d2]">
                then let the proof do the talking.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#8ea0aa]">
              Atrak Pages works best when you already have a few real links. Bring a
              homepage, a project or repo, and one proof-heavy page like docs,
              video, or a demo.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Link2,
                title: "Import your proof",
                desc: "Paste URLs from GitHub, your site, demos, videos, docs, or school projects.",
              },
              {
                icon: Sparkles,
                title: "Generate the story",
                desc: "Atrak Pages shapes the headline, about section, case studies, and resume bullets.",
              },
              {
                icon: Search,
                title: "Share the result",
                desc: "Publish a public profile and separate resume link in one flow.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#79e5d2]/20 bg-[#79e5d2]/8">
                    <Icon className="h-5 w-5 text-[#79e5d2]" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[#8ea0aa]">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#79e5d2]">
              Strong example inputs
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "https://your-site.com",
                "https://github.com/yourname",
                "https://youtube.com/@yourname",
                "https://docs.google.com/...",
              ].map((example) => (
                <span
                  key={example}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[#d8e2e7]"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="relative w-full max-w-xl justify-self-center lg:max-w-none">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="animate-pulse-glow flex h-9 w-9 items-center justify-center rounded-xl border border-[#79e5d2]/30 bg-[linear-gradient(135deg,rgba(121,229,210,0.9),rgba(207,255,246,0.92))] text-[10px] font-black tracking-[0.22em] text-[#041117]">AP</div>
              <span className="brand-display text-[1.4rem] leading-none tracking-tight text-white">
                Atrak Pages
              </span>
            </Link>
            <p className="mt-3 text-sm text-[#7a8d98]">
              Create your free account
            </p>
          </div>

          <div
            className="relative overflow-hidden rounded-[1.75rem] border border-white/10 p-8"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(14,22,28,0.85)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#8fa9ff]/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[#79e5d2]/8 blur-2xl"
            />

            <div className="relative mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[#79e5d2]">
                Step 1 of 2
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Create your account
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#81929d]">
                You will land in the import flow next. No credit card is needed
                to publish the first version.
              </p>
            </div>

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
                    help: "This becomes the public name on your portfolio.",
                  },
                  {
                    label: "Username",
                    key: "username",
                    type: "text",
                    placeholder: "yourhandle",
                    help: submitted
                      ? `Public path preview: /u/${form.username || "yourhandle"}`
                      : "Choose the clean public URL you want people to share.",
                  },
                  {
                    label: "Email",
                    key: "email",
                    type: "email",
                    placeholder: "you@example.com",
                    help: "Use the inbox where you want product updates and password resets.",
                  },
                  {
                    label: "Password",
                    key: "password",
                    type: "password",
                    placeholder: "••••••••",
                    help: "Use at least 6 characters. You can change it later.",
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
                  <p className="mt-1.5 text-xs leading-6 text-[#657781]">{f.help}</p>
                </div>
              ))}

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#79e5d2]">
                  What happens next
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    "Paste a few URLs that show your best work.",
                    "Atrak Pages crawls the sources and captures screenshots.",
                    "Generate a public profile and resume view from the evidence.",
                  ].map((step) => (
                    <div key={step} className="flex items-start gap-2 text-sm text-[#cbd5db]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#79e5d2]" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

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
                  <span className="inline-flex items-center gap-2">
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>

              <div className="neon-divider my-2" />

              <p className="text-center text-sm text-[#6e7e89]">
                Already have an account?{" "}
                <Link
                  href={loginHref}
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
    </div>
  );
}

function RegisterPageFallback() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080e12] flex items-center justify-center px-4 py-12">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-6 py-5 text-sm text-[#7a8d98]">
        Loading the onboarding flow…
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
