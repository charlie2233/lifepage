import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { getDemoProjectVideoSeedData } from "../src/lib/demo-public-pages";
import { ProjectMediaObjectSchema } from "../src/lib/project-media";
import { buildProjectVideoPrompt } from "../src/lib/project-videos";
import { storeProjectVideoAssets } from "../src/lib/project-video-storage";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function pollUntilComplete(client: OpenAI, videoId: string) {
  while (true) {
    const video = await client.videos.retrieve(videoId);
    process.stdout.write(
      `Video ${videoId} status: ${video.status} ${typeof video.progress === "number" ? `(${Math.round(video.progress)}%)` : ""}\n`
    );
    if (video.status === "completed" || video.status === "failed") {
      return video;
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
}

async function downloadBuffer(
  client: OpenAI,
  videoId: string,
  variant: "video" | "thumbnail"
) {
  const response = await client.videos.downloadContent(videoId, { variant });
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const seedProfiles = getDemoProjectVideoSeedData();
  const outputDir = path.join(process.cwd(), "output", "demo-project-videos");
  const manifestPath = path.join(outputDir, "manifest.json");
  const manifest: Record<string, Record<string, Array<Record<string, unknown>>>> =
    {};

  try {
    const existing = JSON.parse(await readFile(manifestPath, "utf8")) as {
      profiles?: Record<string, Record<string, Array<Record<string, unknown>>>>;
    };
    Object.assign(manifest, existing.profiles ?? {});
  } catch {
    // Start fresh if no manifest exists yet.
  }

  for (const profile of seedProfiles) {
    manifest[profile.username] = manifest[profile.username] ?? {};

    for (const project of profile.projects) {
      const projectKey = slugify(project.title);
      if (manifest[profile.username]?.[projectKey]?.length) {
        process.stdout.write(
          `Skipping ${profile.username}/${project.title}; manifest entry already exists.\n`
        );
        continue;
      }

      const prompt = buildProjectVideoPrompt({
        displayName: profile.name,
        headline: profile.headline,
        mode: profile.mode,
        project,
      });
      const artifactId = `demo-${profile.username}-${slugify(project.title)}-${Date.now()}`;
      const created = await client.videos.create({
        model: process.env.OPENAI_SORA_MODEL ?? "sora-2",
        prompt,
        seconds: "8",
        size: "1280x720",
      });
      const completed = await pollUntilComplete(client, created.id);

      if (completed.status !== "completed") {
        throw new Error(
          `Sora failed for ${profile.username}/${project.title}: ${completed.error?.message ?? "unknown error"}`
        );
      }

      const [videoBuffer, posterBuffer] = await Promise.all([
        downloadBuffer(client, created.id, "video"),
        downloadBuffer(client, created.id, "thumbnail"),
      ]);
      const stored = await storeProjectVideoAssets({
        artifactId,
        projectTitle: project.title,
        videoBuffer,
        posterBuffer,
      });

      manifest[profile.username][projectKey] = [
        ProjectMediaObjectSchema.parse({
          type: "video",
          url: stored.videoUrl,
          posterUrl: stored.posterUrl,
          title: `${project.title} demo video`,
          provider: "openai-sora",
          status: "ready",
          durationSeconds: 8,
          storageKey: stored.videoStorageKey,
          sourceArtifactId: artifactId,
          error: null,
        }),
      ];

      await mkdir(outputDir, { recursive: true });
      await writeFile(
        manifestPath,
        JSON.stringify(
          { generatedAt: new Date().toISOString(), profiles: manifest },
          null,
          2
        ),
        "utf8"
      );
    }
  }

  process.stdout.write(`Wrote demo video manifest to ${manifestPath}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
