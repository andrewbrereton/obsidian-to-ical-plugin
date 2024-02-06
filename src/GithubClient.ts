import { Octokit } from '@octokit/rest';
import { getSetting } from './SettingsManager';
import { SETTINGS } from './Model/Settings';

export class GithubClient {
  octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: getSetting(SETTINGS.githubPersonalAccessToken)
    });
  }

  async save(calendar: string) {
    const f = getSetting(SETTINGS.filename);
    const options = {
      gist_id: getSetting(SETTINGS.githubGistId),
      files: {
        [f]: {
          content: calendar,
        }
      }
    };
    await this.octokit.rest.gists.update(options);
  }
}
