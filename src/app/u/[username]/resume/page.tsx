import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicResumePage } from "@/components/public-resume-page";
import type { ProfileJSON } from "@/lib/schema";
import { getDemoPublicPageUser } from "@/lib/demo-public-pages";
import { getPublicPageUserByUsername } from "@/lib/public-page";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const revalidate = 300;

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user =
    (await getPublicPageUserByUsername(username)) ??
    (await getDemoPublicPageUser(username));

  if (!user) {
    return { title: "Not found" };
  }

  const profile = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;

  return {
    title: `${user.name ?? username} Resume`,
    description:
      profile?.resume.summary ??
      profile?.headline ??
      `Resume of ${user.name ?? username}`,
    alternates: {
      canonical: absoluteUrl(`/u/${username}/resume`),
    },
    openGraph: {
      title: `${user.name ?? username} Resume — ${SITE_NAME}`,
      description:
        profile?.resume.summary ??
        profile?.headline ??
        `Resume of ${user.name ?? username}`,
      url: absoluteUrl(`/u/${username}/resume`),
      images: [
        {
          url: absoluteUrl("/og-atrak-pages.svg"),
          width: 1200,
          height: 630,
          alt: `${user.name ?? username} resume preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name ?? username} Resume — ${SITE_NAME}`,
      description:
        profile?.resume.summary ??
        profile?.headline ??
        `Resume of ${user.name ?? username}`,
      images: [absoluteUrl("/og-atrak-pages.svg")],
    },
  };
}

export default async function PublicResumeRoute({
  params,
  searchParams,
}: Props) {
  const { username } = await params;
  const { mode } = await searchParams;
  const user =
    (await getPublicPageUserByUsername(username)) ??
    (await getDemoPublicPageUser(username));

  if (!user) {
    notFound();
  }

  return (
    <PublicResumePage
      basePath={`/u/${username}`}
      queryMode={mode}
      user={user}
      username={username}
    />
  );
}
