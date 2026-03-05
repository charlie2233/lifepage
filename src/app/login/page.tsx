"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            Life<span className="text-[#00f5ff]">Page</span>
          </Link>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
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
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00f5ff] text-black py-2.5 rounded-lg font-medium hover:bg-[#00c8d4] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#00f5ff] hover:underline">
              Sign up
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
