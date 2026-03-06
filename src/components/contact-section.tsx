"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mbdzrwbo";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  company: z.string().trim().max(120, "Company name is too long.").optional(),
  message: z
    .string()
    .trim()
    .min(20, "Add a bit more detail so we can help.")
    .max(2000, "Message is too long."),
  website: z.string().max(0).optional(),
});

type ContactFormValues = z.infer<typeof ContactSchema>;

const INITIAL_FORM: ContactFormValues = {
  name: "",
  email: "",
  company: "",
  message: "",
  website: "",
};

export function ContactSection() {
  const [form, setForm] = useState<ContactFormValues>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = ContactSchema.safeParse(form);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue?.message ?? "Please check your message and try again.");
      return;
    }

    if (parsed.data.website) {
      setSuccess(true);
      setForm(INITIAL_FORM);
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", parsed.data.name);
      payload.append("email", parsed.data.email);
      payload.append("company", parsed.data.company ?? "");
      payload.append("message", parsed.data.message);
      payload.append("_subject", "LifePage contact form");

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { errors?: Array<{ message?: string }> }
          | null;
        throw new Error(
          body?.errors?.[0]?.message ?? "Message failed to send. Please try again."
        );
      }

      setSuccess(true);
      setForm(INITIAL_FORM);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Message failed to send. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="relative z-10 max-w-5xl mx-auto px-6 pb-20"
    >
      <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:p-8">
        <div className="rounded-2xl border border-white/10 bg-[#00f5ff]/[0.05] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00f5ff]/20 bg-[#00f5ff]/10">
            <Mail className="h-5 w-5 text-[#00f5ff]" />
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#00f5ff]">
            Contact us
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Need help, a demo, or a partnership conversation?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Send a message and we will get back to you about product questions,
            bug reports, school use cases, creator workflows, or custom deploy
            needs.
          </p>

          <div className="mt-6 space-y-3 text-sm text-gray-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Product support, onboarding, and feedback
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Partnerships, campus pilots, and creator programs
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Custom domains, deployment, and AI workflow questions
            </div>
          </div>
        </div>

        <form
          action={FORMSPREE_ENDPOINT}
          method="POST"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">
                Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Alex Chen"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-400">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm text-gray-400">
              Company or school
            </label>
            <input
              name="company"
              value={form.company ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, company: event.target.value }))
              }
              placeholder="Optional"
              autoComplete="organization"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm text-gray-400">
              Message
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              placeholder="Tell us what you need help with."
              rows={6}
              required
              minLength={20}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
            />
          </div>

          <input type="hidden" name="_subject" value="LifePage contact form" />

          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, website: event.target.value }))
              }
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              Message sent. We will get back to you by email.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-gray-500">
              This form sends directly to our support inbox via Formspree.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00f5ff] px-5 py-3 text-sm font-semibold text-black hover:bg-[#00e5ef] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  Send message
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
