import { cp, mkdir, copyFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const distDir = "dist";
const clientDir = join(distDir, "client");
const hostingSource = ".openai/hosting.json";
const hostingTarget = join(distDir, ".openai", "hosting.json");
const serverTarget = join(distDir, "server", "index.js");
const clientEntries = [
  "assets",
  "auth",
  "banners",
  "heroes",
  "ranks",
  "strategy",
  "favicon.svg",
  "index.html",
];

await mkdir(clientDir, { recursive: true });
await Promise.all(clientEntries.map((entry) =>
  cp(join(distDir, entry), join(clientDir, entry), { recursive: true, force: true }),
));

await mkdir(dirname(hostingTarget), { recursive: true });
await copyFile(hostingSource, hostingTarget);

await mkdir(dirname(serverTarget), { recursive: true });
await writeFile(serverTarget, `const cacheHeaders = {
  "cache-control": "public, max-age=0, must-revalidate"
};

function withRequestUrl(pathname, request) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}

async function serveStaticSpa(request, env) {
  if (env?.ASSETS?.fetch) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = new URL(request.url);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (request.method === "GET" && acceptsHtml && !url.pathname.includes(".")) {
      return env.ASSETS.fetch(withRequestUrl("/index.html", request));
    }

    return response;
  }

  return new Response("Royal Supremacy is built and ready for the Sites asset runtime.", {
    headers: { "content-type": "text/plain; charset=utf-8", ...cacheHeaders }
  });
}

export default {
  fetch: serveStaticSpa
};

export { serveStaticSpa as fetch };
`, "utf8");
