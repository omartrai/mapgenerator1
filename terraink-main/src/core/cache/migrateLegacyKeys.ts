/**
 * One-time move of browser data saved under the previous brand names, so a
 * returning visitor keeps their cart, saved details and language.
 */
const RENAMED_KEYS: ReadonlyArray<readonly [legacy: string, current: string]> = [
  ["maploom.cart.v1", "noria.cart.v1"],
  ["maploom.lastOrder.v1", "noria.lastOrder.v1"],
  ["maploom.customer.v1", "noria.customer.v1"],
  ["maploom-language", "noria-language"],
  ["terraink.poster.count", "noria.poster.count"],
  ["terraink:recent-locations", "noria:recent-locations"],
];

/** Versioned response cache; safe to drop, it refills on demand. */
const LEGACY_CACHE_PREFIX = "terraink:";

function migrateLegacyStorageKeys(): void {
  try {
    const storage = window.localStorage;

    for (const [legacy, current] of RENAMED_KEYS) {
      const value = storage.getItem(legacy);
      if (value === null) continue;
      if (storage.getItem(current) === null) storage.setItem(current, value);
      storage.removeItem(legacy);
    }

    const stale: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(LEGACY_CACHE_PREFIX)) stale.push(key);
    }
    stale.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage blocked (private mode): nothing to migrate.
  }
}

// Runs on import: main.tsx imports this first, so every module that reads
// storage while loading already sees the migrated keys.
migrateLegacyStorageKeys();
