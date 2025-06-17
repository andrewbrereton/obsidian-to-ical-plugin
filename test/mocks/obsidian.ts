// Mock Obsidian API for testing
declare const jest: any;

export class Plugin {
  app: any;
  loadData = jest.fn(() => Promise.resolve({}));
  saveData = jest.fn(() => Promise.resolve());
  addSettingTab = jest.fn();
  addRibbonIcon = jest.fn();
  addCommand = jest.fn();
  registerInterval = jest.fn(() => 1);
  clearInterval = jest.fn();
}

export class PluginSettingTab {
  constructor(public app: any, public plugin: any) {}
  display = jest.fn();
  hide = jest.fn();
}

export class Setting {
  settingEl: any;
  constructor(public containerEl: any) {}
  setName = jest.fn(() => this);
  setDesc = jest.fn(() => this);
  addText = jest.fn(() => this);
  addTextArea = jest.fn(() => this);
  addDropdown = jest.fn(() => this);
  addToggle = jest.fn(() => this);
  setValue = jest.fn(() => this);
  onChange = jest.fn(() => this);
}

export class TFile {
  constructor(public path: string, public name: string) {}
}

export class Notice {
  constructor(public message: string) {}
}

export const mockApp = {
  vault: {
    getMarkdownFiles: jest.fn(() => []),
    cachedRead: jest.fn(() => Promise.resolve('')),
    getAbstractFileByPath: jest.fn(() => null),
    create: jest.fn(() => Promise.resolve()),
    modify: jest.fn(() => Promise.resolve()),
    adapter: {
      write: jest.fn(() => Promise.resolve()),
      exists: jest.fn(() => Promise.resolve(false))
    }
  },
  metadataCache: {
    getFileCache: jest.fn(() => null),
    getCache: jest.fn(() => null)
  }
};

export const requestUrl = jest.fn();

export const mockPlugin = {
  app: mockApp,
  loadData: jest.fn(() => Promise.resolve({})),
  saveData: jest.fn(() => Promise.resolve()),
  addSettingTab: jest.fn(),
  addRibbonIcon: jest.fn(),
  addCommand: jest.fn(),
  registerInterval: jest.fn(() => 1),
  clearInterval: jest.fn()
};

export const mockVault = mockApp.vault;
export const mockMetadataCache = mockApp.metadataCache;

// Mock TFile
export class MockTFile {
  constructor(public path: string, public name: string) {}
}

// Mock CachedMetadata
export const mockCachedMetadata = {
  listItems: [
    {
      position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 20, offset: 20 } },
      parent: 0,
      task: '- [ ] Test task',
      id: '1'
    }
  ],
  sections: [],
  headings: [],
  links: [],
  tags: []
};