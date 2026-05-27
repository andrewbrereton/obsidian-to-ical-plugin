jest.mock('obsidian', () => ({ Plugin: class {} }));

import { migrateSecretsToStore, SecretStore, StorageLike } from '../SecretStore';

function makeFakeStorage(): StorageLike & { dump: () => Record<string, string> } {
  const data = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return data.has(key) ? data.get(key) ?? null : null;
    },
    setItem(key: string, value: string): void {
      data.set(key, value);
    },
    removeItem(key: string): void {
      data.delete(key);
    },
    dump(): Record<string, string> {
      return Object.fromEntries(data);
    },
  };
}

describe('SecretStore', () => {
  it('returns empty string for a missing name', () => {
    const store = new SecretStore(makeFakeStorage());
    expect(store.get('secretKey')).toBe('');
  });

  it('round-trips a value through set/get', () => {
    const store = new SecretStore(makeFakeStorage());
    store.set('secretKey', 'abc123');
    expect(store.get('secretKey')).toBe('abc123');
  });

  it('applies the plugin prefix to the underlying storage key', () => {
    const storage = makeFakeStorage();
    const store = new SecretStore(storage);
    store.set('secretKey', 'abc123');
    expect(storage.dump()).toEqual({ 'obsidian-ical-plugin.secretKey': 'abc123' });
  });

  it('removes the underlying key when set to empty string', () => {
    const storage = makeFakeStorage();
    const store = new SecretStore(storage);
    store.set('secretKey', 'abc123');
    store.set('secretKey', '');
    expect(storage.dump()).toEqual({});
    expect(store.get('secretKey')).toBe('');
  });

  it('has() reports presence accurately', () => {
    const store = new SecretStore(makeFakeStorage());
    expect(store.has('secretKey')).toBe(false);
    store.set('secretKey', 'abc');
    expect(store.has('secretKey')).toBe(true);
    store.set('secretKey', '');
    expect(store.has('secretKey')).toBe(false);
  });

  it('isolates separate names', () => {
    const store = new SecretStore(makeFakeStorage());
    store.set('secretKey', 'sk');
    store.set('githubPersonalAccessToken', 'gp');
    expect(store.get('secretKey')).toBe('sk');
    expect(store.get('githubPersonalAccessToken')).toBe('gp');
  });

  describe('migrateLegacy', () => {
    it('moves a legacy value into the store when nothing is present', () => {
      const store = new SecretStore(makeFakeStorage());
      const moved = store.migrateLegacy('secretKey', 'legacy-value');
      expect(moved).toBe(true);
      expect(store.get('secretKey')).toBe('legacy-value');
    });

    it('returns false and does nothing when legacy value is empty', () => {
      const store = new SecretStore(makeFakeStorage());
      expect(store.migrateLegacy('secretKey', '')).toBe(false);
      expect(store.migrateLegacy('secretKey', undefined)).toBe(false);
      expect(store.migrateLegacy('secretKey', null)).toBe(false);
      expect(store.has('secretKey')).toBe(false);
    });

    it('returns false and preserves the existing store value when already migrated', () => {
      const store = new SecretStore(makeFakeStorage());
      store.set('secretKey', 'existing');
      const moved = store.migrateLegacy('secretKey', 'legacy-attempt');
      expect(moved).toBe(false);
      expect(store.get('secretKey')).toBe('existing');
    });

    it('is idempotent — calling twice in a row only migrates the first time', () => {
      const store = new SecretStore(makeFakeStorage());
      expect(store.migrateLegacy('secretKey', 'legacy')).toBe(true);
      expect(store.migrateLegacy('secretKey', 'legacy')).toBe(false);
      expect(store.get('secretKey')).toBe('legacy');
    });
  });

  describe('default storage fallback', () => {
    it('does not throw when constructed without an explicit storage', () => {
      // In the jest 'node' test env globalThis.localStorage is undefined, so
      // the SecretStore falls back to its in-memory shim. The point of this
      // test is just to confirm the constructor doesn't blow up under that
      // condition.
      const store = new SecretStore();
      expect(store.get('secretKey')).toBe('');
      store.set('secretKey', 'hello');
      expect(store.get('secretKey')).toBe('hello');
    });
  });
});

describe('migrateSecretsToStore', () => {
  it('moves both legacy secret values into the store and clears the carrier', () => {
    const store = new SecretStore(makeFakeStorage());
    const carrier = {
      secretKey: 'legacy-sk',
      githubPersonalAccessToken: 'legacy-pat',
      // unrelated fields are preserved
      otherField: 'kept',
    } as unknown as { secretKey?: string; githubPersonalAccessToken?: string; otherField?: string };

    const migrated = migrateSecretsToStore(carrier, store);

    expect(migrated).toBe(true);
    expect(store.get('secretKey')).toBe('legacy-sk');
    expect(store.get('githubPersonalAccessToken')).toBe('legacy-pat');
    expect(carrier.secretKey).toBe('');
    expect(carrier.githubPersonalAccessToken).toBe('');
    expect(carrier.otherField).toBe('kept');
  });

  it('is idempotent — running twice does not overwrite or re-migrate', () => {
    const storage = makeFakeStorage();
    const store = new SecretStore(storage);
    const carrier = { secretKey: 'legacy-sk', githubPersonalAccessToken: '' } as { secretKey?: string; githubPersonalAccessToken?: string };

    const firstRun = migrateSecretsToStore(carrier, store);
    const secondRun = migrateSecretsToStore(carrier, store);

    expect(firstRun).toBe(true);
    expect(secondRun).toBe(false);
    expect(store.get('secretKey')).toBe('legacy-sk');
    expect(carrier.secretKey).toBe('');
  });

  it('returns false and changes nothing when there is no legacy data', () => {
    const storage = makeFakeStorage();
    const store = new SecretStore(storage);
    const carrier = { secretKey: '', githubPersonalAccessToken: '' } as { secretKey?: string; githubPersonalAccessToken?: string };

    const migrated = migrateSecretsToStore(carrier, store);

    expect(migrated).toBe(false);
    expect(store.has('secretKey')).toBe(false);
    expect(store.has('githubPersonalAccessToken')).toBe(false);
    expect(storage.dump()).toEqual({});
  });

  it('preserves the existing store value when the legacy carrier has a different one', () => {
    const store = new SecretStore(makeFakeStorage());
    store.set('secretKey', 'already-in-store');
    const carrier = { secretKey: 'leftover-on-disk' } as { secretKey?: string; githubPersonalAccessToken?: string };

    const migrated = migrateSecretsToStore(carrier, store);

    expect(migrated).toBe(false);
    expect(store.get('secretKey')).toBe('already-in-store');
    // Carrier is still cleared even though no migration happened — once a
    // secret lives in the store, the disk copy is no longer the source of
    // truth.
    expect(carrier.secretKey).toBe('');
  });

  it('clears only the secret fields, leaves unrelated fields untouched', () => {
    const store = new SecretStore(makeFakeStorage());
    const carrier = {
      secretKey: 'sk',
      githubPersonalAccessToken: 'pat',
      filename: 'obsidian.ics',
      isDebug: true,
      periodicSaveInterval: 5,
    } as Record<string, unknown>;

    migrateSecretsToStore(carrier as { secretKey?: string; githubPersonalAccessToken?: string }, store);

    expect(carrier.filename).toBe('obsidian.ics');
    expect(carrier.isDebug).toBe(true);
    expect(carrier.periodicSaveInterval).toBe(5);
  });

  it('migrates only one field when only one has a legacy value', () => {
    const store = new SecretStore(makeFakeStorage());
    const carrier = { secretKey: '', githubPersonalAccessToken: 'just-the-pat' } as { secretKey?: string; githubPersonalAccessToken?: string };

    const migrated = migrateSecretsToStore(carrier, store);

    expect(migrated).toBe(true);
    expect(store.has('secretKey')).toBe(false);
    expect(store.get('githubPersonalAccessToken')).toBe('just-the-pat');
    expect(carrier.githubPersonalAccessToken).toBe('');
  });
});
