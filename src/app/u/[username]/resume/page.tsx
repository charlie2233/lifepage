import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicResumePage } from "@/components/public-resume-page";
import type { ProfileJSON } from "@/lib/schema";
import { getDemoPublicPageUser } from "@/lib/demo-public-pages";
import { getPublicPageUserByUsername } from "@/lib/public-page";
import { getAbsoluteUrl, getSiteUrl } from "@/lib/site-metadata";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const canonicalPath = `/u/${username}/resume`;
  const ogImagePath = `/u/${username}/opengraph-image`;
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
    metadataBase: getSiteUrl(),
    title: `${user.name ?? username} Resume — LifePage`,
    description:
      profile?.resume.summary ??
      profile?.headline ??
      `Resume of ${user.name ?? username}`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${user.name ?? username} Resume — LifePage`,
      description:
        profile?.resume.summary ??
        profile?.headline ??
        `Resume of ${user.name ?? username}`,
      type: "website",
      url: canonicalPath,
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: `${user.name ?? username} resume on LifePage`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name ?? username} Resume — LifePage`,
      description:
        profile?.resume.summary ??
        profile?.headline ??
        `Resume of ${user.name ?? username}`,
      images: [ogImagePath],
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
      shareUrl={
        getAbsoluteUrl(`/u/${username}/resume`)?.toString() ??
        `https://lifepage.one/u/${username}/resume`
      }
      user={user}
      username={username}
    />
  );
}
