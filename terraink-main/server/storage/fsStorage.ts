import { promises as fs } from "node:fs";
import path from "node:path";
import type { IOrderStorage } from "./ports.js";

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
};

/** Disk adapter: `vite dev`, and the standalone server with DATA_DIR on a volume. */
export function createFsStorage(rootDir: string): IOrderStorage {
  const resolve = (relative: string) => {
    const target = path.resolve(rootDir, relative);
    if (!target.startsWith(path.resolve(rootDir))) {
      throw new Error("Invalid storage path");
    }
    return target;
  };

  async function walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    const files: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...(await walk(full)));
      else files.push(full);
    }
    return files;
  }

  return {
    kind: "filesystem",
    async putJson(relative, value) {
      const target = resolve(relative);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, JSON.stringify(value, null, 2), "utf8");
    },
    async getJson<T>(relative: string) {
      try {
        return JSON.parse(await fs.readFile(resolve(relative), "utf8")) as T;
      } catch {
        return null;
      }
    },
    async putFile(relative, body, _contentType) {
      const target = resolve(relative);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, body);
    },
    async getFile(relative) {
      try {
        const target = resolve(relative);
        const body = new Uint8Array(await fs.readFile(target));
        return {
          body,
          contentType: CONTENT_TYPES[path.extname(target).toLowerCase()] ?? "application/octet-stream",
          size: body.byteLength,
        };
      } catch {
        return null;
      }
    },
    async list(prefix) {
      const files = await walk(resolve(prefix));
      const stats = await Promise.all(
        files.map(async (file) => ({
          path: path.relative(rootDir, file).split(path.sep).join("/"),
          uploadedAt: (await fs.stat(file)).mtime,
        })),
      );
      return stats.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    },
  };
}
