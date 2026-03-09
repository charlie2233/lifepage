import { z } from "zod";
import type { AgentFocusKind } from "@/lib/agent-focus";

export const AGENT_SKILL_CATEGORIES = ["persona", "workflow"] as const;
export type AgentSkillCategory = (typeof AGENT_SKILL_CATEGORIES)[number];

export const PERSONA_SKILL_IDS = [
  "brand_strategist",
  "recruiter_editor",
  "admissions_coach",
  "evidence_analyst",
  "ui_art_director",
  "resume_strategist",
] as const;

export const WORKFLOW_SKILL_IDS = [
  "improve_headline",
  "rewrite_about",
  "rebuild_skills_section",
  "sharpen_projects",
  "tighten_experiences",
  "align_for_hiring",
  "align_for_admissions",
  "redesign_public_pages",
  "refresh_from_evidence",
] as const;

export const PersonaSkillIdSchema = z.enum(PERSONA_SKILL_IDS);
export const WorkflowSkillIdSchema = z.enum(WORKFLOW_SKILL_IDS);

export type PersonaSkillId = (typeof PERSONA_SKILL_IDS)[number];
export type WorkflowSkillId = (typeof WORKFLOW_SKILL_IDS)[number];
export type AgentSkillId = PersonaSkillId | WorkflowSkillId;

export type AgentExecutionMode = "reply" | "artifact" | "mutate";

export type AgentMutationTarget =
  | "profile.headline"
  | "profile.about"
  | "profile.skills"
  | "profile.projects"
  | "profile.experiences"
  | "profile.achievements"
  | "profile.resume.summary"
  | "profile.resume.bullets"
  | "publicPageSettings.mode"
  | "publicPageSettings.visibility"
  | "publicPageSettings.theme"
  | "publicPageSettings.themeConfig"
  | "publicPageSettings.resumeModel"
  | "publicPageSettings.resumeModelConfig";

export type AgentToolReference =
  | "generate_timeline"
  | "generate_video_script"
  | "generate_tree"
  | "set_portfolio_theme"
  | "set_resume_model"
  | "regenerate_profile"
  | "recrawl_url";

interface AgentSkillBase<TId extends AgentSkillId> {
  id: TId;
  label: string;
  category: AgentSkillCategory;
  description: string;
  supportedFocusKinds: AgentFocusKind[];
  promptInstructions: string[];
  successCriteria: string[];
}

export interface PersonaSkillDefinition
  extends AgentSkillBase<PersonaSkillId> {
  category: "persona";
  allowedTools: AgentToolReference[];
  allowedMutationTargets: AgentMutationTarget[];
}

export interface WorkflowSkillDefinition
  extends AgentSkillBase<WorkflowSkillId> {
  category: "workflow";
  allowedTools: AgentToolReference[];
  allowedMutationTargets: AgentMutationTarget[];
  defaultExecutionMode: Exclude<AgentExecutionMode, "reply">;
}

function createPersonaSkill(
  definition: Omit<PersonaSkillDefinition, "category">
): PersonaSkillDefinition {
  return { ...definition, category: "persona" };
}

function createWorkflowSkill(
  definition: Omit<WorkflowSkillDefinition, "category">
): WorkflowSkillDefinition {
  return { ...definition, category: "workflow" };
}

const ALL_FOCUS_KINDS: AgentFocusKind[] = [
  "theme",
  "headline",
  "about",
  "resume",
  "skills",
  "projects",
  "project",
  "experiences",
  "experience",
  "achievements",
  "achievement",
  "timeline",
  "evidence",
];

export const PERSONA_SKILLS: PersonaSkillDefinition[] = [
  createPersonaSkill({
    id: "brand_strategist",
    label: "Brand Strategist",
    description:
      "Clarifies positioning, sharpens differentiation, and frames the portfolio as a coherent personal brand.",
    supportedFocusKinds: ALL_FOCUS_KINDS,
    allowedTools: [
      "generate_timeline",
      "generate_video_script",
      "generate_tree",
      "set_portfolio_theme",
      "set_resume_model",
      "regenerate_profile",
      "recrawl_url",
    ],
    allowedMutationTargets: [
      "profile.headline",
      "profile.about",
      "profile.skills",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "profile.resume.summary",
      "profile.resume.bullets",
      "publicPageSettings.mode",
      "publicPageSettings.theme",
      "publicPageSettings.themeConfig",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    promptInstructions: [
      "Lead with positioning and narrative clarity.",
      "Make the portfolio feel intentionally differentiated rather than generic.",
      "Prefer concise, reusable brand language over long explanations.",
    ],
    successCriteria: [
      "The user's value proposition is obvious within seconds.",
      "Copy and structure feel aligned across headline, about, proof, and resume.",
    ],
  }),
  createPersonaSkill({
    id: "recruiter_editor",
    label: "Recruiter Editor",
    description:
      "Optimizes clarity, screening speed, and hiring relevance for employers, recruiters, and hiring managers.",
    supportedFocusKinds: [
      "headline",
      "about",
      "resume",
      "skills",
      "projects",
      "project",
      "experiences",
      "experience",
      "achievements",
      "achievement",
      "timeline",
    ],
    allowedTools: [
      "generate_timeline",
      "generate_video_script",
      "generate_tree",
      "set_portfolio_theme",
      "set_resume_model",
      "regenerate_profile",
    ],
    allowedMutationTargets: [
      "profile.headline",
      "profile.about",
      "profile.skills",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "profile.resume.summary",
      "profile.resume.bullets",
      "publicPageSettings.mode",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    promptInstructions: [
      "Bias toward concrete outcomes, role fit, and signal density.",
      "Use scannable language and remove vague claims.",
      "Prefer credibility and clarity over cleverness.",
    ],
    successCriteria: [
      "A recruiter can quickly see role fit and evidence of execution.",
      "Resume and portfolio language reduce ambiguity and filler.",
    ],
  }),
  createPersonaSkill({
    id: "admissions_coach",
    label: "Admissions Coach",
    description:
      "Frames work and life experience for school, scholarship, and program applications with strong narrative arc and reflection.",
    supportedFocusKinds: [
      "headline",
      "about",
      "resume",
      "skills",
      "projects",
      "project",
      "experiences",
      "experience",
      "achievements",
      "achievement",
      "timeline",
    ],
    allowedTools: [
      "generate_timeline",
      "generate_video_script",
      "generate_tree",
      "set_resume_model",
      "regenerate_profile",
    ],
    allowedMutationTargets: [
      "profile.headline",
      "profile.about",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "profile.resume.summary",
      "profile.resume.bullets",
      "publicPageSettings.mode",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    promptInstructions: [
      "Highlight growth, reflection, and trajectory.",
      "Tie accomplishments to motivation and future direction.",
      "Keep the tone thoughtful, specific, and credible.",
    ],
    successCriteria: [
      "The narrative clearly explains why the applicant is compelling.",
      "Application-facing copy sounds intentional without becoming melodramatic.",
    ],
  }),
  createPersonaSkill({
    id: "evidence_analyst",
    label: "Evidence Analyst",
    description:
      "Works from source material first, turning raw proof and crawl data into stronger claims and sharper structure.",
    supportedFocusKinds: [
      "skills",
      "projects",
      "project",
      "experiences",
      "experience",
      "achievements",
      "achievement",
      "timeline",
      "evidence",
    ],
    allowedTools: [
      "generate_timeline",
      "generate_tree",
      "regenerate_profile",
      "recrawl_url",
    ],
    allowedMutationTargets: [
      "profile.skills",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "profile.resume.summary",
      "profile.resume.bullets",
    ],
    promptInstructions: [
      "Stay grounded in proof and avoid unsupported claims.",
      "Prefer edits that increase factual density and traceability back to evidence.",
      "Call out gaps when the proof is thin.",
    ],
    successCriteria: [
      "Each stronger claim is still defensible from the evidence.",
      "The portfolio feels more credible because proof and copy align.",
    ],
  }),
  createPersonaSkill({
    id: "ui_art_director",
    label: "UI Art Director",
    description:
      "Improves the presentation system, theme direction, and on-page hierarchy for public portfolio and resume pages.",
    supportedFocusKinds: ["theme", "resume", "projects", "project", "timeline"],
    allowedTools: [
      "generate_timeline",
      "set_portfolio_theme",
      "set_resume_model",
      "generate_tree",
    ],
    allowedMutationTargets: [
      "publicPageSettings.mode",
      "publicPageSettings.visibility",
      "publicPageSettings.theme",
      "publicPageSettings.themeConfig",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    promptInstructions: [
      "Make visual decisions feel intentional, not trendy or generic.",
      "Prioritize hierarchy, readability, and fit for the user's goals.",
      "Use the existing theme and resume model systems instead of raw CSS.",
    ],
    successCriteria: [
      "The public portfolio has a coherent design direction.",
      "The design changes remain production-safe and renderable by the existing system.",
    ],
  }),
  createPersonaSkill({
    id: "resume_strategist",
    label: "Resume Strategist",
    description:
      "Optimizes the resume view for screening, hierarchy, and concise evidence-heavy storytelling.",
    supportedFocusKinds: [
      "headline",
      "resume",
      "skills",
      "projects",
      "project",
      "experiences",
      "experience",
      "achievements",
      "achievement",
    ],
    allowedTools: [
      "set_resume_model",
      "generate_timeline",
      "generate_tree",
      "regenerate_profile",
    ],
    allowedMutationTargets: [
      "profile.resume.summary",
      "profile.resume.bullets",
      "profile.skills",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    promptInstructions: [
      "Optimize for skim speed and hiring or admissions relevance.",
      "Favor crisp bullets and strong hierarchy over decorative language.",
      "Keep the resume tighter than the public profile page.",
    ],
    successCriteria: [
      "The resume reads faster and feels more structured than before.",
      "Key evidence appears higher and more clearly.",
    ],
  }),
];

export const WORKFLOW_SKILLS: WorkflowSkillDefinition[] = [
  createWorkflowSkill({
    id: "improve_headline",
    label: "Improve Headline",
    description:
      "Rewrite the portfolio headline to make positioning clearer, sharper, and more differentiated.",
    supportedFocusKinds: ["headline", "about", "resume"],
    allowedTools: [],
    allowedMutationTargets: ["profile.headline"],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Produce a concise headline that is immediately useful on the public profile.",
      "Prefer clarity and specificity over buzzwords.",
    ],
    successCriteria: [
      "The headline is stronger and more memorable without becoming vague.",
    ],
  }),
  createWorkflowSkill({
    id: "rewrite_about",
    label: "Rewrite About",
    description:
      "Rewrite the about section so it tells a stronger story and supports the user's goals.",
    supportedFocusKinds: ["about", "headline", "resume"],
    allowedTools: [],
    allowedMutationTargets: ["profile.about"],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Tighten the about section into a clearer narrative.",
      "Keep it grounded in proof and future direction.",
    ],
    successCriteria: [
      "The about section reads like a deliberate story instead of a generic bio.",
    ],
  }),
  createWorkflowSkill({
    id: "rebuild_skills_section",
    label: "Rebuild Skills",
    description:
      "Reorganize and rewrite the skills section to emphasize stronger clusters and more credible levels.",
    supportedFocusKinds: ["skills", "projects", "experiences", "evidence"],
    allowedTools: ["generate_tree"],
    allowedMutationTargets: ["profile.skills"],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Group skills into a sharper, more credible set.",
      "Avoid padding with low-signal or unsupported skills.",
    ],
    successCriteria: [
      "The skills list is shorter, clearer, and easier to trust.",
    ],
  }),
  createWorkflowSkill({
    id: "sharpen_projects",
    label: "Sharpen Projects",
    description:
      "Rewrite project framing to make problem, approach, impact, and proof clearer.",
    supportedFocusKinds: ["projects", "project", "skills", "evidence"],
    allowedTools: ["generate_timeline", "generate_tree"],
    allowedMutationTargets: ["profile.projects"],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Strengthen each project as a proof-of-work case study.",
      "Prefer outcome-driven language and concrete detail.",
    ],
    successCriteria: [
      "Projects read like credible case studies with stronger signal.",
    ],
  }),
  createWorkflowSkill({
    id: "tighten_experiences",
    label: "Tighten Experiences",
    description:
      "Rewrite work and leadership experience to reduce filler and strengthen outcomes.",
    supportedFocusKinds: ["experiences", "experience", "resume", "evidence"],
    allowedTools: ["generate_timeline"],
    allowedMutationTargets: ["profile.experiences", "profile.resume.bullets"],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Turn experience bullets into sharper outcome-focused lines.",
      "Reduce repetition and weak phrasing.",
    ],
    successCriteria: [
      "Experience bullets are clearer, shorter, and stronger.",
    ],
  }),
  createWorkflowSkill({
    id: "align_for_hiring",
    label: "Align for Hiring",
    description:
      "Reposition the portfolio and resume for recruiting and employer review.",
    supportedFocusKinds: [
      "headline",
      "about",
      "resume",
      "skills",
      "projects",
      "experiences",
      "achievements",
    ],
    allowedTools: ["set_resume_model", "generate_timeline", "generate_tree"],
    allowedMutationTargets: [
      "profile.headline",
      "profile.about",
      "profile.skills",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "profile.resume.summary",
      "profile.resume.bullets",
      "publicPageSettings.mode",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Bias the portfolio toward hiring clarity and recruiter speed.",
      "Make role fit and execution evidence easy to spot.",
    ],
    successCriteria: [
      "The portfolio feels more employer-ready and screening-friendly.",
    ],
  }),
  createWorkflowSkill({
    id: "align_for_admissions",
    label: "Align for Admissions",
    description:
      "Reposition the portfolio and resume for applications, admissions, and scholarship review.",
    supportedFocusKinds: [
      "headline",
      "about",
      "resume",
      "projects",
      "experiences",
      "achievements",
      "timeline",
    ],
    allowedTools: ["set_resume_model", "generate_timeline"],
    allowedMutationTargets: [
      "profile.headline",
      "profile.about",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "profile.resume.summary",
      "profile.resume.bullets",
      "publicPageSettings.mode",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Emphasize growth, initiative, and trajectory.",
      "Keep application-facing narrative coherent across the portfolio and resume.",
    ],
    successCriteria: [
      "The portfolio feels more compelling for admissions readers and reviewers.",
    ],
  }),
  createWorkflowSkill({
    id: "redesign_public_pages",
    label: "Redesign Public Pages",
    description:
      "Change the portfolio and resume presentation system using existing theme and resume model controls.",
    supportedFocusKinds: ["theme", "resume", "projects", "timeline"],
    allowedTools: ["set_portfolio_theme", "set_resume_model"],
    allowedMutationTargets: [
      "publicPageSettings.mode",
      "publicPageSettings.visibility",
      "publicPageSettings.theme",
      "publicPageSettings.themeConfig",
      "publicPageSettings.resumeModel",
      "publicPageSettings.resumeModelConfig",
    ],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Use the existing preset and custom configuration systems instead of inventing raw CSS.",
      "Design for the user's stated audience and portfolio mode.",
    ],
    successCriteria: [
      "The public portfolio and resume feel more intentional and consistent.",
    ],
  }),
  createWorkflowSkill({
    id: "refresh_from_evidence",
    label: "Refresh From Evidence",
    description:
      "Use current evidence sources to refresh profile content, proof framing, or stale source material.",
    supportedFocusKinds: [
      "skills",
      "projects",
      "project",
      "experiences",
      "experience",
      "achievements",
      "achievement",
      "timeline",
      "evidence",
    ],
    allowedTools: ["recrawl_url", "regenerate_profile", "generate_timeline"],
    allowedMutationTargets: [
      "profile.about",
      "profile.skills",
      "profile.projects",
      "profile.experiences",
      "profile.achievements",
      "profile.resume.summary",
      "profile.resume.bullets",
    ],
    defaultExecutionMode: "mutate",
    promptInstructions: [
      "Stay anchored to evidence and do not inflate unsupported claims.",
      "Use existing proof to improve clarity and completeness.",
    ],
    successCriteria: [
      "The refreshed content is more accurate, stronger, and better supported.",
    ],
  }),
];

const PERSONA_SKILL_MAP = new Map(
  PERSONA_SKILLS.map((skill) => [skill.id, skill] as const)
);
const WORKFLOW_SKILL_MAP = new Map(
  WORKFLOW_SKILLS.map((skill) => [skill.id, skill] as const)
);

export function getPersonaSkill(skillId?: string | null) {
  return skillId ? PERSONA_SKILL_MAP.get(skillId as PersonaSkillId) ?? null : null;
}

export function getWorkflowSkill(skillId?: string | null) {
  return skillId ? WORKFLOW_SKILL_MAP.get(skillId as WorkflowSkillId) ?? null : null;
}

export function describePersonaSkillsForPrompt() {
  return PERSONA_SKILLS.map(
    (skill) =>
      `${skill.id}: ${skill.label} — ${skill.description} Focus: ${skill.supportedFocusKinds.join(
        ", "
      )}.`
  ).join("\n");
}

export function describeWorkflowSkillsForPrompt() {
  return WORKFLOW_SKILLS.map(
    (skill) =>
      `${skill.id}: ${skill.label} — ${skill.description} Allowed mutations: ${skill.allowedMutationTargets.join(
        ", "
      )}. Allowed tools: ${
        skill.allowedTools.length ? skill.allowedTools.join(", ") : "none"
      }.`
  ).join("\n");
}

export function describeSkillInstructionsForPrompt(
  personaSkillId?: PersonaSkillId | null,
  workflowSkillId?: WorkflowSkillId | null
) {
  const personaSkill = getPersonaSkill(personaSkillId);
  const workflowSkill = getWorkflowSkill(workflowSkillId);
  const blocks: string[] = [];

  if (personaSkill) {
    blocks.push(
      `Persona skill: ${personaSkill.label} (${personaSkill.id})
- ${personaSkill.promptInstructions.join("\n- ")}
Success criteria:
- ${personaSkill.successCriteria.join("\n- ")}`
    );
  }

  if (workflowSkill) {
    blocks.push(
      `Workflow skill: ${workflowSkill.label} (${workflowSkill.id})
- ${workflowSkill.promptInstructions.join("\n- ")}
Success criteria:
- ${workflowSkill.successCriteria.join("\n- ")}`
    );
  }

  return blocks.join("\n\n");
}

export function getWorkflowSkillForTool(
  tool?: AgentToolReference | null
): WorkflowSkillDefinition | null {
  switch (tool) {
    case "set_portfolio_theme":
    case "set_resume_model":
      return getWorkflowSkill("redesign_public_pages");
    case "regenerate_profile":
    case "recrawl_url":
      return getWorkflowSkill("refresh_from_evidence");
    default:
      return null;
  }
}

export function getDefaultPersonaSkillForContext(input: {
  workflowSkillId?: WorkflowSkillId | null;
  focusKind?: AgentFocusKind | null;
}) {
  if (input.workflowSkillId === "align_for_hiring") {
    return getPersonaSkill("recruiter_editor");
  }
  if (input.workflowSkillId === "align_for_admissions") {
    return getPersonaSkill("admissions_coach");
  }
  if (input.workflowSkillId === "redesign_public_pages" || input.focusKind === "theme") {
    return getPersonaSkill("ui_art_director");
  }
  if (input.focusKind === "resume") {
    return getPersonaSkill("resume_strategist");
  }
  if (input.focusKind === "evidence") {
    return getPersonaSkill("evidence_analyst");
  }
  return getPersonaSkill("brand_strategist");
}

export function getAutoSkillOptions() {
  return {
    persona: [{ id: "auto", label: "Auto" }, ...PERSONA_SKILLS],
    workflow: [{ id: "auto", label: "Auto" }, ...WORKFLOW_SKILLS],
  };
}
