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
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            Life<span className="text-[#00f5ff]">Page</span>
          </Link>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4"
        >
          {error && (
            <p className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
              {error}
            </p>
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
              <label className="block text-sm text-gray-400 mb-1">
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50"
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00f5ff] text-black py-2.5 rounded-lg font-medium hover:bg-[#00c8d4] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#00f5ff] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
        <p className="text-center text-xs text-gray-600 mt-6">
          Built by{" "}
          <a
            href="https://atrak.dev"
            className="text-[#00f5ff]/70 hover:text-[#00f5ff]"
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
