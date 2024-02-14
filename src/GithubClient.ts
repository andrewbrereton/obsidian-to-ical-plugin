import { Octokit } from '@octokit/rest';
import { settings } from './SettingsManager';

export class GithubClient {
  octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: settings.githubPersonalAccessToken,
    });
  }

  async save(calendar: string) {
    const f = settings.filename;
    const options = {
      gist_id: settings.githubGistId,
      files: {
        [f]: {
          content: calendar,
        }
      }
    };
    await this.octokit.rest.gists.update(options);
  }
}
