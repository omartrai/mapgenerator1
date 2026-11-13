/**
 * Runs the whole site as one server, for hosts other than Vercel (Railway,
 * a VPS, Docker): the built pages from ./dist and the order API under /api.
 * Orders and reviews are kept in DATA_DIR, which must be a persistent volume.
 *
 *   bun run build && bun run start
 */
import { createReadStream, promises as fs } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { brotliCompress, gzip } from "node:zlib";
import { createApiHandler } from "./router.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = String(process.env.DATA_DIR ?? "").trim();
const MAX_BODY_BYTES = 16_000_000;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pbf": "application/x-protobuf",
};
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".svg", ".txt", ".xml"]);
const SECURITY_HEADERS = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), payment=()",
};
/** Vite names bundles `name-<hash>.ext`; those never change, so cache them hard. */
const HASHED = /-[A-Za-z0-9_-]{8,}\.(js|css|woff2?)$/;

const handleApi = createApiHandler({
  env: process.env,
  ...(DATA_DIR ? { dataDir: path.resolve(DATA_DIR) } : {}),
});

/** Text files compressed once per deploy and kept in memory. */
const compressed = new Map<string, Promise<Buffer>>();
function compress(file: string, encoding: "br" | "gzip"): Promise<Buffer> {
  const key = `${encoding}:${file}`;
  let pending = compressed.get(key);
  if (!pending) {
    pending = fs
      .readFile(file)
      .then((raw) => (encoding === "br" ? promisify(brotliCompress)(raw) : promisify(gzip)(raw)));
    compressed.set(key, pending);
  }
  return pending;
}

async function readBody(request: IncomingMessage): Promise<Buffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Request is too large."), { status: 413 });
    chunks.push(chunk as Buffer);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function serveApi(request: IncomingMessage, response: ServerResponse) {
  const host = request.headers.host ?? "localhost";
  const protocol = String(request.headers["x-forwarded-proto"] ?? "http").split(",")[0];
  const body = await readBody(request);
  const answer = await handleApi(
    new Request(`${protocol}://${host}${request.url}`, {
      method: request.method,
      headers: Object.entries(request.headers).flatMap(([key, value]) =>
        value === undefined ? [] : [[key, Array.isArray(value) ? value.join(", ") : value] as [string, string]],
      ),
      body: body ? new Uint8Array(body) : undefined,
    }),
  );
  response.statusCode = answer.status;
  answer.headers.forEach((value, key) => response.setHeader(key, value));
  response.end(Buffer.from(await answer.arrayBuffer()));
}

async function isFile(file: string): Promise<boolean> {
  return fs.stat(file).then((stat) => stat.isFile(), () => false);
}

async function serveStatic(request: IncomingMessage, response: ServerResponse) {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    pathname = "/";
  }

  let file = path.join(DIST, path.normalize(pathname));
  let status = 200;
  if (!file.startsWith(DIST)) file = path.join(DIST, "index.html");
  if (!(await isFile(file))) {
    // /privacy style folders, then the app's own routes; a missing file is a 404.
    const folderIndex = path.join(file, "index.html");
    if (await isFile(folderIndex)) file = folderIndex;
    else if (path.extname(pathname)) {
      file = path.join(DIST, "404.html");
      status = 404;
    } else file = path.join(DIST, "index.html");
  }

  const extension = path.extname(file).toLowerCase();
  const name = path.basename(file);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.setHeader(key, value));
  response.setHeader("Content-Type", TYPES[extension] ?? "application/octet-stream");
  response.setHeader(
    "Cache-Control",
    name === "sw.js"
      ? "no-store"
      : HASHED.test(name)
        ? "public, max-age=31536000, immutable"
        : extension === ".html"
          ? "no-cache"
          : "public, max-age=3600",
  );
  response.statusCode = status;
  if (request.method === "HEAD") return void response.end();

  const accepts = String(request.headers["accept-encoding"] ?? "");
  const encoding = !COMPRESSIBLE.has(extension) ? null : accepts.includes("br") ? "br" : accepts.includes("gzip") ? "gzip" : null;
  if (encoding) {
    response.setHeader("Content-Encoding", encoding);
    response.setHeader("Vary", "Accept-Encoding");
    return void response.end(await compress(file, encoding));
  }
  createReadStream(file).pipe(response);
}

createServer((request, response) => {
  const work = request.url?.startsWith("/api/") || request.url === "/api"
    ? serveApi(request, response)
    : request.method === "GET" || request.method === "HEAD"
      ? serveStatic(request, response)
      : Promise.resolve(void response.writeHead(405).end());
  work.catch((error: Error & { status?: number }) => {
    console.error("[server]", error);
    if (response.headersSent) return void response.end();
    response.writeHead(error.status ?? 500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.status ? error.message : "Server error." }));
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log(`[server] listening on :${PORT}`);
  console.log(`[server] orders: ${DATA_DIR ? `disk (${path.resolve(DATA_DIR)})` : process.env.BLOB_READ_WRITE_TOKEN ? "Vercel Blob" : "NOT CONFIGURED — set DATA_DIR"}`);
});
