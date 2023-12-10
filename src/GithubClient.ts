import { Octokit } from "@octokit/rest";

export class GithubClient {
  octokit: Octokit;
  githubGistId: string
  filename: string;

  constructor(githubPersonalAccessToken: string, githubGistId: string, filename: string) {
    this.octokit = new Octokit({
      auth: githubPersonalAccessToken
    });
    this.githubGistId = githubGistId;
    this.filename = filename;
  }

  async save(calendar: string) {
    const f = this.filename;
    const options = {
      gist_id: this.githubGistId,
      files: {
        [f]: {
          content: calendar,
        }
      }
    };
    await this.octokit.rest.gists.update(options);
  }
}
