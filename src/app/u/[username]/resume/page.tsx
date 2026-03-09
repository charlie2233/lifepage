import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicResumePage } from "@/components/public-resume-page";
import type { ProfileJSON } from "@/lib/schema";
import { getDemoPublicPageUser } from "@/lib/demo-public-pages";
import { getPublicPageUserByUsername } from "@/lib/public-page";

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
    title: `${user.name ?? username} Resume — LifePage`,
    description:
      profile?.resume.summary ??
      profile?.headline ??
      `Resume of ${user.name ?? username}`,
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
