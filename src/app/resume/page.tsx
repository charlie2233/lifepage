import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { PublicResumePage } from "@/components/public-resume-page";
import { getRequestHostname, isInternalAppHostname } from "@/lib/custom-domain";
import { getPublicPageUserByCustomDomain } from "@/lib/public-page";
import type { ProfileJSON } from "@/lib/schema";
import { getAbsoluteUrl, getSiteUrl } from "@/lib/site-metadata";

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
    return { title: "Resume — LifePage" };
  }

  if (!user) {
    return {
      metadataBase: getSiteUrl(hostname),
      title: "Resume not found — LifePage",
      description: hostname
        ? `No public resume is connected to ${hostname}.`
        : "No public resume found.",
      alternates: {
        canonical: "/resume",
      },
    };
  }

  const profile = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;

  return {
    metadataBase: getSiteUrl(hostname),
    title: `${user.name ?? user.username ?? "Portfolio"} Resume — LifePage`,
    description:
      profile?.resume.summary ??
      profile?.headline ??
      `Resume of ${user.name ?? user.username ?? "this user"}`,
    alternates: {
      canonical: "/resume",
    },
    openGraph: {
      title: `${user.name ?? user.username ?? "Portfolio"} Resume — LifePage`,
      description:
        profile?.resume.summary ??
        profile?.headline ??
        `Resume of ${user.name ?? user.username ?? "this user"}`,
      type: "website",
      url: "/resume",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${user.name ?? user.username ?? "Portfolio"} resume`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name ?? user.username ?? "Portfolio"} Resume — LifePage`,
      description:
        profile?.resume.summary ??
        profile?.headline ??
        `Resume of ${user.name ?? user.username ?? "this user"}`,
      images: ["/opengraph-image"],
    },
  };
}

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function CustomDomainResumePage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const { hostname, isCustomHost, user } = await getCustomDomainResumeContext();

  if (!isCustomHost || !user?.username) {
    notFound();
  }

  return (
    <PublicResumePage
      basePath="/"
      queryMode={mode}
      shareUrl={
        getAbsoluteUrl("/resume", hostname)?.toString() ??
        "https://lifepage.one/resume"
      }
      user={user}
      username={user.username}
    />
  );
}
