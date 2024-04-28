import { Plugin } from 'obsidian';
import { log } from './Logger';
import { DEFAULT_SETTINGS, Settings } from './Model/Settings';

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

    return SettingsManager.instance;
  }

  public static get settingsManager(): SettingsManager {
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

  public settingsWithoutSecrets(): Settings {
    return Object.assign({}, this.settings, {
      githubPersonalAccessToken: '<redacted>',
      githubGistId: '<redacted>',
      githubUsername: '<redacted>',
    });
  }

  public get githubPersonalAccessToken(): string {
    return this.settings.githubPersonalAccessToken;
  }

  public set githubPersonalAccessToken(githubPersonalAccessToken: string) {
    this.settings.githubPersonalAccessToken = githubPersonalAccessToken;
    this.saveSettings();
  }

  public get githubGistId(): string {
    return this.settings.githubGistId;
  }

  public set githubGistId(githubGistId: string) {
    this.settings.githubGistId = githubGistId;
    this.saveSettings();
  }

  public get githubUsername(): string {
    return this.settings.githubUsername;
  }

  public set githubUsername(githubUsername: string) {
    this.settings.githubUsername = githubUsername;
    this.saveSettings();
  }

  public get filename(): string {
    return this.settings.filename;
  }

  public set filename(filename: string) {
    this.settings.filename = filename;
    this.saveSettings();
  }

  public get isPeriodicSaveEnabled(): boolean {
    return this.settings.isPeriodicSaveEnabled;
  }

  public set isPeriodicSaveEnabled(isPeriodicSaveEnabled: boolean) {
    this.settings.isPeriodicSaveEnabled = isPeriodicSaveEnabled;
    this.saveSettings();
  }

  public get periodicSaveInterval(): number {
    return this.settings.periodicSaveInterval;
  }

  public set periodicSaveInterval(periodicSaveInterval: number) {
    this.settings.periodicSaveInterval = periodicSaveInterval;
    this.saveSettings();
  }

  public get isSaveToGistEnabled(): boolean {
    return this.settings.isSaveToGistEnabled;
  }

  public set isSaveToGistEnabled(isSaveToGistEnabled: boolean) {
    this.settings.isSaveToGistEnabled = isSaveToGistEnabled;
    this.saveSettings();
  }

  public get isSaveToFileEnabled(): boolean {
    return this.settings.isSaveToFileEnabled;
  }

  public set isSaveToFileEnabled(isSaveToFileEnabled: boolean) {
    this.settings.isSaveToFileEnabled = isSaveToFileEnabled;
    this.saveSettings();
  }

  public get savePath(): string {
    return this.settings.savePath;
  }

  public set savePath(savePath: string) {
    this.settings.savePath = savePath;
    this.saveSettings();
  }

  public get saveFileName(): string {
    return this.settings.saveFileName;
  }

  public set saveFileName(saveFileName: string) {
    this.settings.saveFileName = saveFileName;
    this.saveSettings();
  }

  public get saveFileExtension(): string {
    return this.settings.saveFileExtension;
  }

  public set saveFileExtension(saveFileExtension: string) {
    this.settings.saveFileExtension = saveFileExtension;
    this.saveSettings();
  }

  public get howToParseInternalLinks(): string {
    return this.settings.howToParseInternalLinks;
  }

  public set howToParseInternalLinks(howToParseInternalLinks: string) {
    this.settings.howToParseInternalLinks = howToParseInternalLinks;
    this.saveSettings();
  }

  public get ignoreCompletedTasks(): boolean {
    return this.settings.ignoreCompletedTasks;
  }

  public set ignoreCompletedTasks(ignoreCompletedTasks: boolean) {
    this.settings.ignoreCompletedTasks = ignoreCompletedTasks;
    this.saveSettings();
  }

  public get isDebug(): boolean {
    return this.settings.isDebug;
  }

  public set isDebug(isDebug: boolean) {
    this.settings.isDebug = isDebug;
    this.saveSettings();
  }

  public get ignoreOldTasks(): boolean {
    return this.settings.ignoreOldTasks;
  }

  public set ignoreOldTasks(ignoreOldTasks: boolean) {
    this.settings.ignoreOldTasks = ignoreOldTasks;
    this.saveSettings();
  }

  public get oldTaskInDays(): number {
    return this.settings.oldTaskInDays;
  }

  public set oldTaskInDays(oldTaskInDays: number) {
    this.settings.oldTaskInDays = oldTaskInDays;
    this.saveSettings();
  }

  public get howToProcessMultipleDates(): string {
    return this.settings.howToProcessMultipleDates;
  }

  public set howToProcessMultipleDates(howToProcessMultipleDates: string) {
    this.settings.howToProcessMultipleDates = howToProcessMultipleDates;
    this.saveSettings();
  }

  public get isIncludeTodos(): boolean {
    return this.settings.isIncludeTodos;
  }

  public set isIncludeTodos(isIncludeTodos: boolean) {
    this.settings.isIncludeTodos = isIncludeTodos;
    this.saveSettings();
  }

  public get isOnlyTasksWithoutDatesAreTodos(): boolean {
    return this.settings.isOnlyTasksWithoutDatesAreTodos;
  }

  public set isOnlyTasksWithoutDatesAreTodos(isOnlyTasksWithoutDatesAreTodos: boolean) {
    this.settings.isOnlyTasksWithoutDatesAreTodos = isOnlyTasksWithoutDatesAreTodos;
    this.saveSettings();
  }

  public get isDayPlannerPluginFormatEnabled(): boolean {
    return this.settings.isDayPlannerPluginFormatEnabled;
  }

  public set isDayPlannerPluginFormatEnabled(isDayPlannerPluginFormatEnabled: boolean) {
    this.settings.isDayPlannerPluginFormatEnabled = isDayPlannerPluginFormatEnabled;
    this.saveSettings();
  }

  public get isIncludeTasksWithTags(): boolean {
    return this.settings.isIncludeTasksWithTags;
  }

  public set isIncludeTasksWithTags(isIncludeTasksWithTags: boolean) {
    this.settings.isIncludeTasksWithTags = isIncludeTasksWithTags;
    this.saveSettings();
  }

  public get includeTasksWithTags(): string {
    return this.settings.includeTasksWithTags;
  }

  public set includeTasksWithTags(includeTasksWithTags: string) {
    this.settings.includeTasksWithTags = includeTasksWithTags;
    this.saveSettings();
  }

  public get isExcludeTasksWithTags(): boolean {
    return this.settings.isExcludeTasksWithTags;
  }

  public set isExcludeTasksWithTags(isExcludeTasksWithTags: boolean) {
    this.settings.isExcludeTasksWithTags = isExcludeTasksWithTags;
    this.saveSettings();
  }

  public get excludeTasksWithTags(): string {
    return this.settings.excludeTasksWithTags;
  }

  public set excludeTasksWithTags(excludeTasksWithTags: string) {
    this.settings.excludeTasksWithTags = excludeTasksWithTags;
    this.saveSettings();
  }

  public get rootFolder(): string {
    return this.settings.rootFolder;
  }

  public set rootFolder(rootFolder: string) {
    this.settings.rootFolder = rootFolder;
    this.saveSettings();
  }
}

export let settings: SettingsManager = SettingsManager.settingsManager;

export async function initSettingsManager(plugin: Plugin): Promise<SettingsManager> {
  settings = await SettingsManager.createInstance(plugin);

  return settings;
}
