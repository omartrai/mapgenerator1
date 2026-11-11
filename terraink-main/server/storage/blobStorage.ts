import { get, list, put } from "@vercel/blob";
import type { IOrderStorage } from "./ports.js";

/**
 * Vercel Blob adapter. Everything is written with private access, so order
 * data and customer details are only reachable through this API with the
 * store's read-write token — never by public URL.
 */
export function createBlobStorage(token: string): IOrderStorage {
  const base = { access: "private" as const, token };

  async function readText(path: string): Promise<string | null> {
    const result = await get(path, { ...base, useCache: false }).catch((error: unknown) => {
      if (error instanceof Error && /not.?found/i.test(error.name + error.message)) return null;
      throw error;
    });
    if (!result || result.statusCode !== 200) return null;
    return new Response(result.stream).text();
  }

  return {
    kind: "blob",
    async putJson(path, value) {
      await put(path, JSON.stringify(value), {
        ...base,
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      });
    },
    async getJson<T>(path: string) {
      const text = await readText(path);
      return text === null ? null : (JSON.parse(text) as T);
    },
    async putFile(path, body, contentType) {
      await put(path, Buffer.from(body), {
        ...base,
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async getFile(path) {
      const result = await get(path, { ...base, useCache: false }).catch(() => null);
      if (!result || result.statusCode !== 200) return null;
      return {
        body: result.stream,
        contentType: result.blob.contentType,
        size: result.blob.size,
      };
    },
    async list(prefix) {
      const entries: { path: string; uploadedAt: Date }[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ token, prefix, cursor, limit: 1000 });
        for (const blob of page.blobs) {
          entries.push({ path: blob.pathname, uploadedAt: new Date(blob.uploadedAt) });
        }
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return entries.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    },
  };
}
