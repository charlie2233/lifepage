import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProfileJSON } from "@/lib/schema";
import { PublicProfilePage } from "@/components/public-profile-page";
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
    title: user.name ?? username,
    description: profile?.headline ?? `Portfolio of ${username}`,
    alternates: {
      canonical: absoluteUrl(`/u/${username}`),
    },
    openGraph: {
      title: `${user.name ?? username} — ${SITE_NAME}`,
      description: profile?.headline ?? `Portfolio of ${username}`,
      url: absoluteUrl(`/u/${username}`),
      images: [
        {
          url: absoluteUrl("/og-atrak-pages.svg"),
          width: 1200,
          height: 630,
          alt: `${user.name ?? username} portfolio preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name ?? username} — ${SITE_NAME}`,
      description: profile?.headline ?? `Portfolio of ${username}`,
      images: [absoluteUrl("/og-atrak-pages.svg")],
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
      user={user}
      username={username}
    />
  );
}
