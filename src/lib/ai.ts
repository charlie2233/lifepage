import {
  buildE2EProfileFromCrawl,
  buildE2EProfileFromText,
  isFakeAiEnabled,
} from "@/lib/e2e-mode";
import {
  generateStructuredJsonFromPrompt,
  type OpenAIClientConfig,
} from "@/lib/openai-structured";
import { ProfileJSONSchema, type ProfileJSON } from "@/lib/schema";
import { type CrawlResult } from "@/lib/crawler";

const PROFILE_JSON_TEMPLATE = `{
  "headline": "string",
  "about": "string",
  "skills": [{"tag": "string", "level": "beginner|intermediate|advanced|expert", "evidenceRefs": []}],
  "experiences": [{"role": "string", "org": "string", "startDate": "string|null", "endDate": "string|null", "bullets": ["string"], "evidenceRefs": []}],
  "projects": [{"title": "string", "problem": "string|null", "approach": "string|null", "impact": "string|null", "tech": ["string"], "links": [{"label": "string", "url": "string"}], "media": [], "evidenceRefs": []}],
  "achievements": [{"title": "string", "context": "string|null", "date": "string|null", "proof": "string|null"}],
  "timeline": [{"year": "string", "milestones": ["string"]}],
  "resume": {"summary": "string", "bullets": ["string"]},
  "stats": {"projectsShipped": 0, "yearsBuilding": 0, "competitions": 0},
  "confidence": 0.8
}`;

export async function generateProfileFromCrawl(
  crawlResults: CrawlResult[],
  userInfo: { name?: string; githubUrl?: string; linkedinUrl?: string },
  model: string,
  clientConfig?: OpenAIClientConfig,
  maxTokens?: number
): Promise<ProfileJSON> {
  if (isFakeAiEnabled()) {
    return buildE2EProfileFromCrawl(crawlResults);
  }

  const evidenceSummary = crawlResults
    .map((r, i) => {
      return `--- Evidence ${i + 1}: ${r.url} ---
Title: ${r.title}
Description: ${r.description}
Headings: ${r.headings.join(" | ")}
Content: ${r.bodyText.slice(0, 1000)}`;
    })
    .join("\n\n");

  const prompt = `You are an expert personal brand analyst and resume writer. Analyze the following web evidence about a person and generate a rich, specific professional profile JSON.

Evidence collected from their websites/projects:
${evidenceSummary}

User info: ${JSON.stringify(userInfo)}

Generate a comprehensive profile JSON with these rules:
1. Use ONLY information found in the evidence - never hallucinate
2. If information is missing, use null (not empty strings)
3. Write resume bullets with action verbs + measurable outcomes
4. Infer skills from technologies/tools mentioned
5. Create a compelling headline (max 10 words)
6. Write an engaging "about" paragraph (2-4 sentences)
7. Extract or infer projects from the content and make each one specific
8. Estimate a confidence score 0-1 based on how much data you have
9. For the timeline, group milestones by year based on any dates mentioned
10. For stats: estimate projectsShipped, yearsBuilding, competitions based on evidence
11. Prefer filling multiple projects, experiences, achievements, and timeline entries when the evidence supports them
12. Make the portfolio feel content-rich, credible, and grounded in shipped work
13. Keep writing concrete and useful for a real public portfolio page, not generic resume filler

Return ONLY valid JSON matching this exact structure:
${PROFILE_JSON_TEMPLATE}`;

  return generateStructuredJsonFromPrompt({
    model,
    schema: ProfileJSONSchema,
    schemaName: "profile_json",
    prompt,
    responseMode: "json_schema",
    temperature: 0.3,
    clientConfig,
    maxTokens,
  });
}

export async function generateProfileFromText(
  text: string,
  userInfo: { name?: string },
  model: string,
  clientConfig?: OpenAIClientConfig,
  maxTokens?: number
): Promise<ProfileJSON> {
  if (isFakeAiEnabled()) {
    return buildE2EProfileFromText(text, userInfo.name);
  }

  const prompt = `You are an expert personal brand analyst. Based on the following text description, generate a rich and specific professional profile JSON.

Text: ${text}
User: ${JSON.stringify(userInfo)}

Write the output so it feels substantial enough for a real public portfolio page. Prefer multiple concrete projects, experiences, achievements, and timeline entries when the text supports them. Keep the writing specific rather than generic.

Return ONLY valid JSON matching this exact structure:
${PROFILE_JSON_TEMPLATE}`;

  return generateStructuredJsonFromPrompt({
    model,
    schema: ProfileJSONSchema,
    schemaName: "profile_json",
    prompt,
    responseMode: "json_schema",
    temperature: 0.3,
    clientConfig,
    maxTokens,
  });
}
