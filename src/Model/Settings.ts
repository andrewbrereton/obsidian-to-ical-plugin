export const HOW_TO_PARSE_INTERNAL_LINKS = {
  DoNotModifyThem: 'Do not modify them',
  KeepTitle: 'Keep the title',
  PreferTitle: 'Prefer the title',
  RemoveThem: 'Remove them',
};

export interface Settings {
  githubPersonalAccessToken: string;
  githubGistId: string;
  githubUsername: string;
  filename: string;
  isPeriodicSaveEnabled: boolean;
  periodicSaveInterval: number;
  isSaveToGistEnabled: boolean;
  isSaveToFileEnabled: boolean;
  savePath: string;
  saveFileName: string;
  saveFileExtension: string;
  howToParseInternalLinks: string;
  ignoreCompletedTasks: boolean;
  isDebug: boolean;
  isIncludeTodos: boolean;
  ignoreOldTasks: boolean;
  oldTaskInDays: number;
}

export const DEFAULT_SETTINGS: Settings = {
  githubPersonalAccessToken: '',
  githubGistId: '',
  githubUsername: '',
  filename: 'obsidian.ics',
  isPeriodicSaveEnabled: true,
  periodicSaveInterval: 5,
  isSaveToGistEnabled: false,
  isSaveToFileEnabled: false,
  savePath: '',
  saveFileName: '',
  saveFileExtension: '.ical',
  howToParseInternalLinks: HOW_TO_PARSE_INTERNAL_LINKS.DoNotModifyThem,
  ignoreCompletedTasks: false,
  isDebug: false,
  isIncludeTodos: false,
  ignoreOldTasks: false,
  oldTaskInDays: 365,
};

export function settingsWithoutSecrets(settings: Settings): Settings {
  return Object.assign({}, settings, {
    githubPersonalAccessToken: '<redacted>',
    githubGistId: '<redacted>',
    githubUsername: '<redacted>',
  });
}
