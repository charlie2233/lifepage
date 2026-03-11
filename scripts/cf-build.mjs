import { spawn } from "node:child_process";
import { access, copyFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const srcDir = join(rootDir, "src");
const middlewarePath = join(srcDir, "middleware.ts");
const middlewareTemplatePath = join(srcDir, "middleware.entry.ts");
const proxyPath = join(srcDir, "proxy.ts");
const proxyBackupPath = join(srcDir, "proxy.ts.cf-build-backup");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code ?? "unknown"}`));
    });
  });
}

async function prepareCloudflareMiddlewareShim() {
  if (!(await exists(proxyPath))) {
    throw new Error("Expected src/proxy.ts to exist before Cloudflare build.");
  }

  if (!(await exists(middlewareTemplatePath))) {
    throw new Error("Expected src/middleware.entry.ts to exist before Cloudflare build.");
  }

  if (await exists(middlewarePath)) {
    throw new Error("Refusing to overwrite an existing src/middleware.ts during Cloudflare build.");
  }

  await rename(proxyPath, proxyBackupPath);
  await copyFile(middlewareTemplatePath, middlewarePath);
}

async function restoreProjectFiles() {
  if (await exists(middlewarePath)) {
    await rm(middlewarePath);
  }

  if (await exists(proxyBackupPath)) {
    await rename(proxyBackupPath, proxyPath);
  }
}

async function main() {
  await prepareCloudflareMiddlewareShim();

  try {
    await run("npx", ["prisma", "generate"]);
    await run("npx", ["opennextjs-cloudflare", "build"]);
  } finally {
    await restoreProjectFiles();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
