import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProfileJSON } from "@/lib/schema";
import { PublicProfilePage } from "@/components/public-profile-page";
import { getDemoPublicPageUser } from "@/lib/demo-public-pages";
import { getPublicPageUserByUsername } from "@/lib/public-page";
import { getAbsoluteUrl, getSiteUrl } from "@/lib/site-metadata";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const canonicalPath = `/u/${username}`;
  const ogImagePath = `${canonicalPath}/opengraph-image`;
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
    title: `${user.name ?? username} — LifePage`,
    description: profile?.headline ?? `Portfolio of ${username}`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${user.name ?? username} — LifePage`,
      description: profile?.headline ?? `Portfolio of ${username}`,
      type: "profile",
      url: canonicalPath,
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: `${user.name ?? username} on LifePage`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name ?? username} — LifePage`,
      description: profile?.headline ?? `Portfolio of ${username}`,
      images: [ogImagePath],
    },
  };
}

export default async function PublicProfileRoute({
  params,
  searchParams,
}: Props) {
  const { username } = await params;
  const { mode } = await searchParams;

  const user =
    (await getPublicPageUserByUsername(username)) ??
    (await getDemoPublicPageUser(username));
  if (!user) notFound();

  return (
    <PublicProfilePage
      basePath={`/u/${username}`}
      queryMode={mode}
      shareUrl={
        getAbsoluteUrl(`/u/${username}`)?.toString() ??
        `https://lifepage.one/u/${username}`
      }
      user={user}
      username={username}
    />
  );
}
