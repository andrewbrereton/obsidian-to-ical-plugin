// Jest setup file for global test configuration
declare const jest: any;

// Mock Obsidian APIs
global.require = jest.fn();

// Mock console methods if needed for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock obsidian module globally
jest.mock('obsidian', () => {
  const { requestUrl, Plugin, PluginSettingTab, Setting, TFile, Notice } = require('./mocks/obsidian');
  return {
    requestUrl,
    Plugin,
    PluginSettingTab, 
    Setting,
    TFile,
    Notice
  };
});