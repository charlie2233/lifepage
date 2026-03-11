import http from "node:http";
import https from "node:https";

interface HostHeaderResponse {
  status: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}

export async function requestWithHostHeader(
  baseUrl: string,
  hostHeader: string,
  path = "/"
): Promise<HostHeaderResponse> {
  const targetUrl = new URL(path, baseUrl);
  const transport = targetUrl.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        method: "GET",
        path: `${targetUrl.pathname}${targetUrl.search}`,
        headers: {
          Host: hostHeader,
        },
      },
      (res) => {
        const chunks: string[] = [];
        res.setEncoding("utf8");
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: chunks.join(""),
            headers: res.headers,
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}
