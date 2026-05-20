import { Octokit } from '@octokit/rest';
import { settings } from './SettingsManager';

export class GithubClient {
  async save(calendar: string) {
    const octokit = new Octokit({
      auth: settings.githubPersonalAccessToken,
    });
    await octokit.rest.gists.update({
      gist_id: settings.githubGistId,
      files: {
        [settings.filename]: {
          content: calendar,
        },
      },
    });
  }
}
