/** Storage port for orders and their files. Paths are store-relative. */
export interface StoredObject {
  body: ReadableStream<Uint8Array> | Uint8Array;
  contentType: string;
  size: number | null;
}

export interface IOrderStorage {
  readonly kind: "blob" | "filesystem";
  putJson(path: string, value: unknown): Promise<void>;
  getJson<T>(path: string): Promise<T | null>;
  putFile(path: string, body: Uint8Array, contentType: string): Promise<void>;
  getFile(path: string): Promise<StoredObject | null>;
  /** Lists object paths under a prefix, newest first. */
  list(prefix: string): Promise<{ path: string; uploadedAt: Date }[]>;
}
