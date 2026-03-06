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
      className="relative z-10 pb-20"
    >
      <div className="lp-shell">
        <div className="lp-panel grid gap-6 rounded-[2rem] p-6 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:p-8">
          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(121,229,210,0.12),rgba(255,255,255,0.03))] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#79e5d2]/25 bg-[#79e5d2]/10">
              <Mail className="h-5 w-5 text-[#79e5d2]" />
            </div>
            <p className="lp-kicker text-xs text-[#79e5d2]">
              Contact us
            </p>
            <h2 className="brand-display mt-3 text-4xl tracking-tight text-[#f8f3ea]">
              Need help, a demo, or a partnership conversation?
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#97a4ae]">
              Send a message and we will get back to you about product questions,
              bug reports, school use cases, creator workflows, or custom deploy
              needs.
            </p>

            <div className="mt-8 space-y-3 text-sm text-[#dde4e9]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Product support, onboarding, and feedback
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Partnerships, campus pilots, and creator programs
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Custom domains, deployment, and AI workflow questions
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="lp-stat-tile p-4">
                <p className="lp-kicker text-[10px] text-[#79e5d2]">Support</p>
                <p className="mt-2 text-sm text-[#d6dee3]">Product help</p>
              </div>
              <div className="lp-stat-tile p-4">
                <p className="lp-kicker text-[10px] text-[#79e5d2]">School</p>
                <p className="mt-2 text-sm text-[#d6dee3]">Admissions pilots</p>
              </div>
              <div className="lp-stat-tile p-4">
                <p className="lp-kicker text-[10px] text-[#79e5d2]">Deploy</p>
                <p className="mt-2 text-sm text-[#d6dee3]">Custom domains</p>
              </div>
            </div>
          </div>

          <form
            action={FORMSPREE_ENDPOINT}
            method="POST"
            onSubmit={handleSubmit}
            className="rounded-[1.75rem] border border-white/10 bg-[#0b1115]/92 p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-[#9ba8b1]">
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
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#5b6670] focus:border-[#79e5d2]/45 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#9ba8b1]">
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
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#5b6670] focus:border-[#79e5d2]/45 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm text-[#9ba8b1]">
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#5b6670] focus:border-[#79e5d2]/45 focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm text-[#9ba8b1]">
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
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#5b6670] focus:border-[#79e5d2]/45 focus:outline-none"
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
              <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            {success && (
              <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Message sent. We will get back to you by email.
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs leading-relaxed text-[#7d8992]">
                This form sends directly to our support inbox via Formspree.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="lp-button-primary px-5 py-3 text-sm disabled:opacity-60"
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
      </div>
    </section>
  );
}
