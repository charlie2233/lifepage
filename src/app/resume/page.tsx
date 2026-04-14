import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { PublicResumePage } from "@/components/public-resume-page";
import { getRequestHostname, isInternalAppHostname } from "@/lib/custom-domain";
import { getPublicPageUserByCustomDomain } from "@/lib/public-page";
import type { ProfileJSON } from "@/lib/schema";
import { SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-dynamic";

async function getCustomDomainResumeContext() {
  const hostname = getRequestHostname((await headers()).get("host"));
  if (!hostname || isInternalAppHostname(hostname)) {
    return { hostname, isCustomHost: false as const, user: null };
  }

  const user = await getPublicPageUserByCustomDomain(hostname);
  return { hostname, isCustomHost: true as const, user };
}

export async function generateMetadata(): Promise<Metadata> {
  const { hostname, isCustomHost, user } = await getCustomDomainResumeContext();

  if (!isCustomHost) {
    return {
      title: "Resume",
      description: SITE_DESCRIPTION,
    };
  }

  if (!user) {
    return {
      title: "Resume not found — Atrak Pages",
      description: hostname
        ? `No public resume is connected to ${hostname}.`
        : "No public resume found.",
    };
  }

  const profile = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;
  const currentOrigin = hostname ? `https://${hostname}` : null;

  return {
    title: `${user.name ?? user.username ?? "Portfolio"} Resume`,
    description:
      profile?.resume.summary ??
      profile?.headline ??
      `Resume of ${user.name ?? user.username ?? "this user"}`,
    alternates: currentOrigin
      ? {
          canonical: new URL("/resume", currentOrigin).toString(),
        }
      : undefined,
    openGraph: currentOrigin
      ? {
          type: "website",
          title: `${user.name ?? user.username ?? "Portfolio"} Resume — Atrak Pages`,
          description:
            profile?.resume.summary ??
            profile?.headline ??
            `Resume of ${user.name ?? user.username ?? "this user"}`,
          url: new URL("/resume", currentOrigin).toString(),
          images: [
            {
              url: new URL("/og-atrak-pages.svg", currentOrigin).toString(),
              width: 1200,
              height: 630,
              alt: `${user.name ?? user.username ?? "Portfolio"} resume preview`,
            },
          ],
        }
      : undefined,
    twitter: currentOrigin
      ? {
          card: "summary_large_image",
          title: `${user.name ?? user.username ?? "Portfolio"} Resume — Atrak Pages`,
          description:
            profile?.resume.summary ??
            profile?.headline ??
            `Resume of ${user.name ?? user.username ?? "this user"}`,
          images: [new URL("/og-atrak-pages.svg", currentOrigin).toString()],
        }
      : undefined,
  };
}

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CustomDomainResumePage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const { isCustomHost, user } = await getCustomDomainResumeContext();

  if (!isCustomHost || !user?.username) {
    notFound();
  }

  return (
    <PublicResumePage
      basePath="/"
      queryMode={mode}
      user={user}
      username={user.username}
    />
  );
}
