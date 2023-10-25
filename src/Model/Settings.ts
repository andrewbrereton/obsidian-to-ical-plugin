export interface Settings {
  githubPersonalAccessToken: string;
  githubGistId: string;
  githubUsername: string;
  filename: string;
}

export const DEFAULT_SETTINGS: Settings = {
  githubPersonalAccessToken: '',
  githubGistId: '',
  githubUsername: '',
  filename: 'obsidian.ics',
};
