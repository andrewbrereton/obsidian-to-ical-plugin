export interface Settings {
  githubPersonalAccessToken: string;
  githubGistId: string;
  githubUsername: string;
  filename: string;
  isPeriodicSaveEnabled: boolean;
  periodicSaveInterval: number;
}

export const DEFAULT_SETTINGS: Settings = {
  githubPersonalAccessToken: '',
  githubGistId: '',
  githubUsername: '',
  filename: 'obsidian.ics',
  isPeriodicSaveEnabled: true,
  periodicSaveInterval: 5
};
