import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, Settings } from "./Model/Settings";
import { log } from "./Logger";

// Settings class in instantiated using a singleton pattern
class SettingsManager {
  private static instance: SettingsManager;
  private settings: Settings;
  private plugin: Plugin;

  private constructor(plugin?: Plugin) {
    if (plugin instanceof Plugin) {
      this.plugin = plugin;
    }
  }

  public static async createInstance(plugin: Plugin): Promise<SettingsManager> {
      SettingsManager.instance = new SettingsManager(plugin);
      await this.instance.loadSettings();

      return SettingsManager.instance
  }

  public static getInstance(): SettingsManager {
    return SettingsManager.instance;
  }

  public async loadSettings() {
    log('Load settings');
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());

    // Because we may be applying new default settings to the settings that were loaded from the filesystem,
    // I think we should save these settings back to the filesystem.
    await this.plugin.saveData(this.settings);
  }

  public async saveSettings() {
    log('Save settings');
    await this.plugin.saveData(this.settings);
  }

  public getSetting<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key];
  }

  public getSettings(): Settings {
    return this.settings;
  }

  public async setSetting<K extends keyof Settings>(key: K, value: any): Promise<void> {
    log(`Set ${key}=${value}`);
    this.settings[key] = value;
    await this.saveSettings();
  }

  public settingsWithoutSecrets(): Settings {
    return Object.assign({}, this.settings, {
      githubPersonalAccessToken: '<redacted>',
      githubGistId: '<redacted>',
      githubUsername: '<redacted>',
    });
  }
}

export async function settingsManager(plugin: Plugin): Promise<SettingsManager> {
  return await SettingsManager.createInstance(plugin);
}

export async function loadSettings() {
  return (await SettingsManager.getInstance()).loadSettings();
}

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  return SettingsManager.getInstance().getSetting(key);
}

export function getSettings(): Settings {
  return SettingsManager.getInstance().getSettings();
}

export async function setSetting<K extends keyof Settings>(key: K, value: any): Promise<void> {
  SettingsManager.getInstance().setSetting(key, value);
}

export function settingsWithoutSecrets(): Settings {
  return SettingsManager.getInstance().settingsWithoutSecrets();
}
