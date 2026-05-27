jest.mock('obsidian', () => ({
  moment: jest.fn(),
  Plugin: class {},
  TFile: class {},
}));

// @octokit/rest is ESM and Jest's CJS pipeline can't parse it. The Main
// constructor instantiates GithubClient which imports it — mock it out so
// these tests don't trip on the import.
jest.mock('@octokit/rest', () => ({ Octokit: class {} }));

const mockSettings = {
  secretKey: '',
  // The rest of the fields aren't used by the apiClient getter but are
  // present to keep TypeScript happy if anything else dereferences settings.
  includeEventsOrTodos: 'EventsOnly',
  howToProcessMultipleDates: 'PreferDueDate',
  isIncludeLinkInDescription: false,
  isIncludeLocation: true,
  isOnlyTasksWithoutDatesAreTodos: true,
};

jest.mock('../SettingsManager', () => ({
  settings: mockSettings,
}));

import { Main } from '../Main';
import { ApiClient } from '../ApiClient';

function makeMain(): Main {
  const fakeApp = {
    vault: {
      getName: () => 'test-vault',
      getMarkdownFiles: () => [],
      cachedRead: jest.fn(),
    },
    metadataCache: {
      getFileCache: jest.fn(),
    },
  };
  const fakeStatusBar = {
    scanning: jest.fn(),
    building: jest.fn(),
    saving: jest.fn(),
    synced: jest.fn(),
    scanError: jest.fn(),
    saveError: jest.fn(),
  };
  return new Main(fakeApp as never, fakeStatusBar as never);
}

describe('Main.apiClient getter', () => {
  beforeEach(() => {
    mockSettings.secretKey = '';
  });

  it('returns a fresh ApiClient instance each access', () => {
    const main = makeMain();
    mockSettings.secretKey = 'a'.repeat(32);

    const a = main.apiClient;
    const b = main.apiClient;

    expect(a).toBeInstanceOf(ApiClient);
    expect(b).toBeInstanceOf(ApiClient);
    expect(a).not.toBe(b);
  });

  it('picks up the current settings.secretKey on every access', () => {
    const main = makeMain();

    mockSettings.secretKey = 'a'.repeat(32);
    expect(main.apiClient.secretKey).toBe('a'.repeat(32));

    // Simulate the user updating their key in the Settings UI.
    mockSettings.secretKey = 'b'.repeat(32);
    expect(main.apiClient.secretKey).toBe('b'.repeat(32));
  });

  it('uses the vault name from the app', () => {
    const main = makeMain();
    mockSettings.secretKey = 'x'.repeat(32);
    expect(main.apiClient.vaultName).toBe('test-vault');
  });

  it('reads an empty key when none has been set', () => {
    const main = makeMain();
    expect(main.apiClient.secretKey).toBe('');
  });
});
