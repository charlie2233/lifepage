const CLOUDFLARE_BROWSER_RENDERING_API_ROOT =
  "https://api.cloudflare.com/client/v4/accounts";

export function isCloudflareBrowserRenderingConfigured() {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_BROWSER_RENDERING_TOKEN
  );
}

export async function captureCloudflareBrowserScreenshot(url: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_BROWSER_RENDERING_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_BROWSER_RENDERING_TOKEN is not configured."
    );
  }

  const response = await fetch(
    `${CLOUDFLARE_BROWSER_RENDERING_API_ROOT}/${accountId}/browser-rendering/screenshot`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Browser Rendering screenshot failed with status ${response.status}.`
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:${contentType};base64,${base64}`;
}
