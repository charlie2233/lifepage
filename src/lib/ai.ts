import OpenAI from "openai";
import { ProfileJSONSchema, type ProfileJSON } from "@/lib/schema";
import { type CrawlResult } from "@/lib/crawler";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateProfileFromCrawl(
  crawlResults: CrawlResult[],
  userInfo: { name?: string; githubUrl?: string; linkedinUrl?: string }
): Promise<ProfileJSON> {
  const evidenceSummary = crawlResults
    .map((r, i) => {
      return `--- Evidence ${i + 1}: ${r.url} ---
Title: ${r.title}
Description: ${r.description}
Headings: ${r.headings.join(" | ")}
Content: ${r.bodyText.slice(0, 1000)}`;
    })
    .join("\n\n");

  const prompt = `You are an expert personal brand analyst and resume writer. Analyze the following web evidence about a person and generate a structured professional profile JSON.

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
7. Extract or infer projects from the content
8. Estimate a confidence score 0-1 based on how much data you have
9. For the timeline, group milestones by year based on any dates mentioned
10. For stats: estimate projectsShipped, yearsBuilding, competitions based on evidence

Return ONLY valid JSON matching this exact structure:
{
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  return ProfileJSONSchema.parse(parsed);
}

export async function generateProfileFromText(
  text: string,
  userInfo: { name?: string }
): Promise<ProfileJSON> {
  const prompt = `You are an expert personal brand analyst. Based on the following text description, generate a structured professional profile JSON.

Text: ${text}
User: ${JSON.stringify(userInfo)}

Return ONLY valid JSON matching this exact structure:
{
  "headline": "string",
  "about": "string",
  "skills": [{"tag": "string", "level": "beginner|intermediate|advanced|expert", "evidenceRefs": []}],
  "experiences": [{"role": "string", "org": "string", "startDate": null, "endDate": null, "bullets": ["string"], "evidenceRefs": []}],
  "projects": [{"title": "string", "problem": null, "approach": null, "impact": null, "tech": [], "links": [], "media": [], "evidenceRefs": []}],
  "achievements": [{"title": "string", "context": null, "date": null, "proof": null}],
  "timeline": [{"year": "string", "milestones": ["string"]}],
  "resume": {"summary": "string", "bullets": ["string"]},
  "stats": {"projectsShipped": 0, "yearsBuilding": 0, "competitions": 0},
  "confidence": 0.5
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  return ProfileJSONSchema.parse(parsed);
}
