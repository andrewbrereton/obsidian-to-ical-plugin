// Minimal Storage-shaped interface so the SecretStore can be tested without
// jsdom or a real browser environment. The Obsidian renderer process exposes
// window.localStorage which satisfies this interface natively.
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PREFIX = 'obsidian-ical-plugin.';

// Wraps a Storage-shaped backend with this plugin's key prefix so we don't
// collide with other plugins, the Obsidian app itself, or future versions of
// this plugin. Holds the two secrets (secretKey, githubPersonalAccessToken)
// per-device rather than in the synced vault data.json.
export class SecretStore {
  private storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? SecretStore.defaultStorage();
  }

  private static defaultStorage(): StorageLike {
    // The Obsidian renderer process always has window.localStorage. In tests
    // (or unusual host environments) we fall back to an in-memory shim so the
    // plugin doesn't crash on access — secrets just won't persist.
    // globalThis (rather than window) so this file is also importable from
    // Node-based test environments where window is undefined; localStorage is
    // a single per-process store either way.
    // eslint-disable-next-line obsidianmd/no-global-this -- intentional: cross-env access
    const ls = (globalThis as { localStorage?: StorageLike }).localStorage;
    if (ls) return ls;
    return new MemoryStorage();
  }

  get(name: string): string {
    return this.storage.getItem(PREFIX + name) ?? '';
  }

  set(name: string, value: string): void {
    if (value === '') {
      this.storage.removeItem(PREFIX + name);
    } else {
      this.storage.setItem(PREFIX + name, value);
    }
  }

  has(name: string): boolean {
    return this.storage.getItem(PREFIX + name) !== null;
  }

  // Move a secret from a legacy on-disk location (data.json) into the secret
  // store. Returns true when a migration actually happened so the caller can
  // clear the legacy field. Idempotent: if the secret already exists in the
  // store, the legacy value is ignored — the store wins.
  migrateLegacy(name: string, legacyValue: string | undefined | null): boolean {
    if (!legacyValue) return false;
    if (this.has(name)) return false;
    this.set(name, legacyValue);
    return true;
  }
}

// Names of the Settings fields that hold secrets. Kept in this module so the
// list lives next to the SecretStore that owns them.
export const SECRET_FIELD_NAMES = ['secretKey', 'githubPersonalAccessToken'] as const;
export type SecretFieldName = (typeof SECRET_FIELD_NAMES)[number];

// Carrier type for the migration helper: a plain object with the secret
// fields as optional string properties. Matches the shape of Settings without
// pulling in the whole interface (avoids a circular import).
export type SecretFieldCarrier = {
  [K in SecretFieldName]?: string;
};

// Pure helper used by SettingsManager. For each known secret field on the
// settings object: copy the legacy value into the store (if non-empty and not
// already migrated), then clear the field on the carrier. Returns true if at
// least one field actually moved into the store on this call.
//
// Exported so it can be exercised in isolation without spinning up the
// SettingsManager singleton + Plugin scaffolding.
export function migrateSecretsToStore<T extends SecretFieldCarrier>(
  carrier: T,
  store: SecretStore,
): boolean {
  let migrated = false;
  for (const name of SECRET_FIELD_NAMES) {
    const legacyValue = carrier[name];
    if (store.migrateLegacy(name, legacyValue)) {
      migrated = true;
    }
    if (carrier[name] !== '') {
      carrier[name] = '';
    }
  }
  return migrated;
}

// In-memory fallback used in tests and any environment without a Storage
// implementation. Not exported — consumers in tests inject their own
// MemoryStorage via the constructor argument.
class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key) ?? null : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}
