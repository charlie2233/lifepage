import type { PublicPageUser } from "@/lib/public-page";
import type { PortfolioThemePresetId } from "@/lib/portfolio-themes";
import type { ProfileJSON } from "@/lib/schema";

interface DemoPublicProfileDefinition {
  username: string;
  name: string;
  headline: string;
  theme: PortfolioThemePresetId;
  mode: "hiring" | "admissions";
  profile: ProfileJSON;
  links: {
    github?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
    location?: string;
  };
  joinedAt: string;
}

const DEMO_PUBLIC_PROFILE_DEFINITIONS: DemoPublicProfileDefinition[] = [
  {
    username: "alexchen",
    name: "Alex Chen",
    headline: "Full-Stack Engineer building AI products and student tools",
    theme: "obsidian",
    mode: "hiring",
    joinedAt: "2025-09-12T00:00:00.000Z",
    links: {
      github: "https://github.com/alexchen",
      linkedin: "https://linkedin.com/in/alexchen",
      website: "https://alexchen.dev",
      location: "San Francisco, CA",
    },
    profile: {
      headline: "Full-Stack Engineer building AI products and student tools",
      about:
        "I build fast product systems across web, AI, and infrastructure. My work focuses on turning messy user needs into clear interfaces, measurable workflows, and shipped software.",
      skills: [
        { tag: "React", level: "expert", evidenceRefs: [] },
        { tag: "TypeScript", level: "expert", evidenceRefs: [] },
        { tag: "Python", level: "advanced", evidenceRefs: [] },
        { tag: "Postgres", level: "advanced", evidenceRefs: [] },
      ],
      experiences: [
        {
          role: "Founder / Engineer",
          org: "Independent",
          startDate: "2023",
          endDate: null,
          bullets: [
            "Built and launched multiple student-facing and creator-facing web products.",
            "Designed product architecture, frontend systems, and AI generation flows end to end.",
          ],
          evidenceRefs: [],
        },
      ],
      projects: [
        {
          title: "LifePage",
          problem: "Resumes and scattered links undersell a person’s actual work.",
          approach:
            "Built an AI-powered portfolio workflow that crawls links, structures proof, and deploys a branded public page.",
          impact:
            "Created a faster way for students and builders to present themselves online with real proof.",
          tech: ["Next.js", "TypeScript", "Prisma", "OpenAI"],
          links: [{ label: "Website", url: "https://lifepage.app" }],
          media: [],
          evidenceRefs: [],
        },
        {
          title: "Campus Opportunity Tracker",
          problem: "Students miss deadlines because application info is fragmented.",
          approach:
            "Built a tracking interface that centralizes scholarship, internship, and admissions opportunities.",
          impact: "Helped users stay on top of deadlines and applications from one place.",
          tech: ["React", "Node.js", "Postgres"],
          links: [],
          media: [],
          evidenceRefs: [],
        },
      ],
      achievements: [
        {
          title: "Shipped multiple AI-assisted web products",
          context: "Independent builder",
          date: "2025",
          proof: null,
        },
      ],
      timeline: [
        { year: "2022", milestones: ["Started shipping personal projects seriously."] },
        { year: "2023", milestones: ["Began building AI-driven product workflows."] },
        { year: "2025", milestones: ["Launched personal-brand and application tooling."] },
      ],
      resume: {
        summary:
          "Full-stack engineer focused on AI product workflows, strong frontend execution, and shipping user-facing systems quickly.",
        bullets: [
          "Built end-to-end AI-assisted portfolio tooling.",
          "Designed and shipped product UX, data models, and backend flows.",
          "Worked across frontend, backend, and growth-facing surfaces.",
        ],
      },
      stats: {
        projectsShipped: 12,
        yearsBuilding: 4,
        competitions: 3,
      },
      confidence: 0.94,
    },
  },
  {
    username: "sarahjones",
    name: "Sarah Jones",
    headline: "Product Designer turning research into sharp digital systems",
    theme: "paper",
    mode: "hiring",
    joinedAt: "2025-08-02T00:00:00.000Z",
    links: {
      linkedin: "https://linkedin.com/in/sarahjones",
      website: "https://sarahjones.design",
      location: "New York, NY",
    },
    profile: {
      headline: "Product Designer turning research into sharp digital systems",
      about:
        "I design product experiences that balance clarity, speed, and emotional tone. My work spans UX systems, interface strategy, research synthesis, and product storytelling.",
      skills: [
        { tag: "Figma", level: "expert", evidenceRefs: [] },
        { tag: "UX Research", level: "advanced", evidenceRefs: [] },
        { tag: "Design Systems", level: "advanced", evidenceRefs: [] },
        { tag: "Prototyping", level: "advanced", evidenceRefs: [] },
      ],
      experiences: [
        {
          role: "Product Designer",
          org: "Freelance / Startup Teams",
          startDate: "2022",
          endDate: null,
          bullets: [
            "Designed product flows, visual systems, and prototypes for early-stage teams.",
            "Translated research findings into cleaner onboarding and engagement experiences.",
          ],
          evidenceRefs: [],
        },
      ],
      projects: [
        {
          title: "Creator Portfolio System",
          problem: "Creator portfolios often feel generic and disconnected from personality.",
          approach:
            "Created an editorial visual system with modular sections, clearer storytelling, and stronger art direction.",
          impact: "Improved narrative clarity and presentation quality across portfolio launches.",
          tech: ["Figma", "Framer", "Design Systems"],
          links: [],
          media: [],
          evidenceRefs: [],
        },
      ],
      achievements: [
        {
          title: "Led multiple design system rollouts",
          context: "Product consulting",
          date: "2024",
          proof: null,
        },
      ],
      timeline: [
        { year: "2021", milestones: ["Shifted from visual design into product work."] },
        { year: "2023", milestones: ["Started building reusable design systems."] },
        { year: "2025", milestones: ["Focused on portfolio and identity-driven product experiences."] },
      ],
      resume: {
        summary:
          "Product designer focused on research-backed interfaces, design systems, and memorable digital presentation.",
        bullets: [
          "Designed polished product systems for early-stage teams.",
          "Improved flow clarity through research synthesis and interaction design.",
          "Created reusable visual and component systems.",
        ],
      },
      stats: {
        projectsShipped: 8,
        yearsBuilding: 3,
        competitions: 1,
      },
      confidence: 0.92,
    },
  },
];

export function getDemoExploreProfiles() {
  return DEMO_PUBLIC_PROFILE_DEFINITIONS.map((profile) => ({
    username: profile.username,
    name: profile.name,
    avatar: null,
    headline: profile.profile.headline,
    skills: profile.profile.skills.slice(0, 4).map((skill) => skill.tag),
    stats: profile.profile.stats,
    theme: profile.theme,
    screenshot: null,
    joinedAt: new Date(profile.joinedAt),
  }));
}

export function getDemoPublicPageUser(username: string): PublicPageUser | null {
  const demo = DEMO_PUBLIC_PROFILE_DEFINITIONS.find(
    (profile) => profile.username === username
  );

  if (!demo) {
    return null;
  }

  return {
    id: `demo-${demo.username}`,
    email: null,
    name: demo.name,
    username: demo.username,
    avatar: null,
    createdAt: new Date(demo.joinedAt),
    updatedAt: new Date(demo.joinedAt),
    passwordHash: null,
    planTier: "free",
    aiProvider: "auto",
    preferredAiModel: null,
    aiUsageRate: "auto",
    aiUsageCycleStartedAt: new Date(demo.joinedAt),
    advancedAiCreditsUsed: 0,
    publicPageSettings: {
      id: `demo-settings-${demo.username}`,
      userId: `demo-${demo.username}`,
      isPublic: true,
      visibility: "public",
      mode: demo.mode,
      theme: demo.theme,
      themeConfig: null,
      resumeModel: "executive",
      resumeModelConfig: null,
      customDomain: null,
      customDomainNormalized: null,
      createdAt: new Date(demo.joinedAt),
      updatedAt: new Date(demo.joinedAt),
    } as PublicPageUser["publicPageSettings"],
    generatedProfiles: [
      {
        id: `demo-generated-${demo.username}`,
        userId: `demo-${demo.username}`,
        data: demo.profile,
        version: 1,
        isActive: true,
        createdAt: new Date(demo.joinedAt),
        updatedAt: new Date(demo.joinedAt),
      },
    ] as PublicPageUser["generatedProfiles"],
    evidenceItems: [] as PublicPageUser["evidenceItems"],
    profile: {
      id: `demo-profile-${demo.username}`,
      userId: `demo-${demo.username}`,
      bio: demo.profile.about,
      headline: demo.profile.headline,
      location: demo.links.location ?? null,
      website: demo.links.website ?? null,
      github: demo.links.github ?? null,
      linkedin: demo.links.linkedin ?? null,
      youtube: demo.links.youtube ?? null,
      theme: demo.theme,
      createdAt: new Date(demo.joinedAt),
      updatedAt: new Date(demo.joinedAt),
    } as PublicPageUser["profile"],
    automations: [],
    agentArtifacts: [],
  } as unknown as PublicPageUser;
}
