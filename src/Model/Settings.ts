export const HOW_TO_PARSE_INTERNAL_LINKS = {
  DoNotModifyThem: 'Do not modify them (default)',
  KeepTitle: 'Keep the title',
  PreferTitle: 'Prefer the title',
  RemoveThem: 'Remove them',
};

export const HOW_TO_PROCESS_MULTIPLE_DATES = {
  PreferDueDate: 'Prefer due date (default)',
  PreferStartDate: 'Prefer start date',
  CreateMultipleEvents: 'Create an event per start/scheduled/due date',
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
  isOnlyTasksWithoutDatesAreTodos: boolean;
  ignoreOldTasks: boolean;
  oldTaskInDays: number;
  howToProcessMultipleDates: string;
  isDayPlannerPluginFormatEnabled: boolean;
  isIncludeTasksWithTags: boolean;
  includeTasksWithTags: string;
  isExcludeTasksWithTags: boolean;
  excludeTasksWithTags: string;
  rootFolder: string;
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
  isOnlyTasksWithoutDatesAreTodos: true,
  ignoreOldTasks: false,
  oldTaskInDays: 365,
  howToProcessMultipleDates: HOW_TO_PROCESS_MULTIPLE_DATES.PreferDueDate,
  isDayPlannerPluginFormatEnabled: false,
  isIncludeTasksWithTags: false,
  includeTasksWithTags: '#calendar',
  isExcludeTasksWithTags: false,
  excludeTasksWithTags: '#ignore',
  rootFolder: '',
};
