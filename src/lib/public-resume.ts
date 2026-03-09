import type { ResumePdfData } from "@/lib/resume-pdf";
import { ProfileJSONSchema } from "@/lib/schema";

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "resume";
}

export function buildResumeFilename(name: string) {
  return `${slugify(name)}-resume.pdf`;
}

export function buildPublicResumeHref(
  basePath: string,
  mode?: "hiring" | "admissions"
) {
  const pathname = basePath === "/"
    ? "/resume"
    : `${basePath.replace(/\/$/, "")}/resume`;

  return mode ? `${pathname}?mode=${mode}` : pathname;
}

export function buildResumeData(args: {
  email?: string | null;
  includeEmail: boolean;
  name: string;
  publicContactEmail?: string | null;
  profile: ReturnType<typeof ProfileJSONSchema.parse>;
  profileLinks: {
    contactEmail?: string | null;
    github?: string | null;
    linkedin?: string | null;
    location?: string | null;
    phone?: string | null;
    website?: string | null;
    youtube?: string | null;
  } | null;
  username?: string | null;
}): ResumePdfData {
  const {
    email,
    includeEmail,
    name,
    publicContactEmail,
    profile,
    profileLinks,
    username,
  } = args;

  const links = [
    profileLinks?.website
      ? { label: "Website", url: profileLinks.website }
      : null,
    profileLinks?.github
      ? { label: "GitHub", url: profileLinks.github }
      : null,
    profileLinks?.linkedin
      ? { label: "LinkedIn", url: profileLinks.linkedin }
      : null,
    profileLinks?.youtube
      ? { label: "YouTube", url: profileLinks.youtube }
      : null,
  ].filter((link): link is NonNullable<typeof link> => Boolean(link));

  return {
    name,
    headline: profile.headline,
    summary: profile.resume.summary || profile.about,
    username,
    email: includeEmail
      ? email ?? profileLinks?.contactEmail ?? publicContactEmail ?? null
      : profileLinks?.contactEmail ?? publicContactEmail ?? null,
    location: profileLinks?.location ?? null,
    links,
    skills: profile.skills.map((skill) => skill.tag),
    bullets: profile.resume.bullets.slice(0, 6),
    experiences: profile.experiences,
    projects: profile.projects.slice(0, 4),
    achievements: profile.achievements.slice(0, 4),
  };
}
