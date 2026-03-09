import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface StoredProjectVideoAssets {
  posterStorageKey: string | null;
  posterUrl: string | null;
  videoStorageKey: string;
  videoUrl: string;
}

const LOCAL_ASSET_ROUTE_PREFIX = "/api/project-videos/assets";

function getProjectVideoOutputRoot() {
  return path.join(process.cwd(), "output", "project-videos");
}

function getR2Endpoint() {
  if (process.env.R2_ENDPOINT) {
    return process.env.R2_ENDPOINT;
  }

  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }

  return null;
}

export function canUseR2ProjectVideoStorage() {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE_URL &&
      getR2Endpoint()
  );
}

function getLocalAssetUrl(key: string) {
  const segments = key.split("/").map((segment) => encodeURIComponent(segment));
  return `${LOCAL_ASSET_ROUTE_PREFIX}/${segments.join("/")}`;
}

function getPublicR2Url(key: string) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL!;
  return `${baseUrl.replace(/\/$/, "")}/${key}`;
}

function sanitizeStorageSegment(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "asset";
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint()!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function createProjectVideoStorageKey(args: {
  artifactId: string;
  projectTitle: string;
  variant: "video" | "poster";
  extension: "mp4" | "webp";
}) {
  const slug = sanitizeStorageSegment(args.projectTitle);
  return `${args.artifactId}/${slug}-${args.variant}.${args.extension}`;
}

export async function storeProjectVideoAssets(args: {
  artifactId: string;
  posterBuffer?: Buffer | null;
  projectTitle: string;
  videoBuffer: Buffer;
}) {
  const videoStorageKey = createProjectVideoStorageKey({
    artifactId: args.artifactId,
    projectTitle: args.projectTitle,
    variant: "video",
    extension: "mp4",
  });
  const posterStorageKey = args.posterBuffer
    ? createProjectVideoStorageKey({
        artifactId: args.artifactId,
        projectTitle: args.projectTitle,
        variant: "poster",
        extension: "webp",
      })
    : null;

  if (canUseR2ProjectVideoStorage()) {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: videoStorageKey,
        Body: args.videoBuffer,
        ContentType: "video/mp4",
      })
    );

    if (args.posterBuffer && posterStorageKey) {
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: posterStorageKey,
          Body: args.posterBuffer,
          ContentType: "image/webp",
        })
      );
    }

    return {
      videoStorageKey,
      videoUrl: getPublicR2Url(videoStorageKey),
      posterStorageKey,
      posterUrl: posterStorageKey ? getPublicR2Url(posterStorageKey) : null,
    } satisfies StoredProjectVideoAssets;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL, and either R2_ENDPOINT or R2_ACCOUNT_ID."
    );
  }

  const outputRoot = getProjectVideoOutputRoot();
  const videoPath = path.join(outputRoot, videoStorageKey);
  await mkdir(path.dirname(videoPath), { recursive: true });
  await writeFile(videoPath, args.videoBuffer);

  if (args.posterBuffer && posterStorageKey) {
    const posterPath = path.join(outputRoot, posterStorageKey);
    await mkdir(path.dirname(posterPath), { recursive: true });
    await writeFile(posterPath, args.posterBuffer);
  }

  return {
    videoStorageKey,
    videoUrl: getLocalAssetUrl(videoStorageKey),
    posterStorageKey,
    posterUrl: posterStorageKey ? getLocalAssetUrl(posterStorageKey) : null,
  } satisfies StoredProjectVideoAssets;
}

export function resolveLocalProjectVideoPath(keySegments: string[]) {
  const outputRoot = getProjectVideoOutputRoot();
  const safeSegments = keySegments.map((segment) => decodeURIComponent(segment));
  const absolutePath = path.resolve(outputRoot, ...safeSegments);

  if (!absolutePath.startsWith(path.resolve(outputRoot) + path.sep)) {
    throw new Error("Invalid asset path.");
  }

  return absolutePath;
}

export function getLocalProjectVideoContentType(filePath: string) {
  if (filePath.endsWith(".mp4")) return "video/mp4";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
