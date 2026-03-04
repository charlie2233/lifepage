import { z } from "zod";

export const SkillSchema = z.object({
  tag: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  evidenceRefs: z.array(z.string()).default([]),
});

export const ExperienceSchema = z.object({
  role: z.string(),
  org: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
  evidenceRefs: z.array(z.string()).default([]),
});

export const ProjectSchema = z.object({
  title: z.string(),
  problem: z.string().nullable(),
  approach: z.string().nullable(),
  impact: z.string().nullable(),
  tech: z.array(z.string()).default([]),
  links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  media: z.array(z.string()).default([]),
  evidenceRefs: z.array(z.string()).default([]),
});

export const AchievementSchema = z.object({
  title: z.string(),
  context: z.string().nullable(),
  date: z.string().nullable(),
  proof: z.string().nullable(),
});

export const TimelineEntrySchema = z.object({
  year: z.string(),
  milestones: z.array(z.string()),
});

export const ProfileJSONSchema = z.object({
  headline: z.string(),
  about: z.string(),
  skills: z.array(SkillSchema).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  achievements: z.array(AchievementSchema).default([]),
  timeline: z.array(TimelineEntrySchema).default([]),
  resume: z.object({
    summary: z.string(),
    bullets: z.array(z.string()).default([]),
  }),
  stats: z.object({
    projectsShipped: z.number().default(0),
    yearsBuilding: z.number().default(0),
    competitions: z.number().default(0),
  }),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ProfileJSON = z.infer<typeof ProfileJSONSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type Skill = z.infer<typeof SkillSchema>;
