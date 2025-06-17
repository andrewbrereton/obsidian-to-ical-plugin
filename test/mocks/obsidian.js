// Mock Obsidian API for testing

class Plugin {
  constructor() {
    this.app = null;
    this.loadData = jest.fn(() => Promise.resolve({}));
    this.saveData = jest.fn(() => Promise.resolve());
    this.addSettingTab = jest.fn();
    this.addRibbonIcon = jest.fn();
    this.addCommand = jest.fn();
    this.registerInterval = jest.fn(() => 1);
    this.clearInterval = jest.fn();
  }
}

class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    this.display = jest.fn();
    this.hide = jest.fn();
  }
}

class Setting {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.settingEl = null;
  }
  
  setName() { return this; }
  setDesc() { return this; }
  addText() { return this; }
  addTextArea() { return this; }
  addDropdown() { return this; }
  addToggle() { return this; }
  setValue() { return this; }
  onChange() { return this; }
}

class TFile {
  constructor(path, name) {
    this.path = path;
    this.name = name;
  }
}

class Notice {
  constructor(message) {
    this.message = message;
  }
}

const mockApp = {
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

const requestUrl = jest.fn();

module.exports = {
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  Notice,
  requestUrl,
  mockApp,
  mockVault: mockApp.vault,
  mockMetadataCache: mockApp.metadataCache
};