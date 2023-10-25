import { Octokit } from "@octokit/rest";

export class GithubClient {
  octokit: Octokit;
  githubGistId: string
  filename: string;

  async setup(githubPersonalAccessToken: string, githubGistId: string, filename: string) {
    this.octokit = new Octokit({
      auth: githubPersonalAccessToken
    });
    this.githubGistId = githubGistId;
    this.filename = filename;
  }

  async save(calendar: string) {
    console.log('gist_id', this.githubGistId);
    console.log('this.filename', this.filename);
    console.log('calendar', calendar);
    const f = this.filename;
    const options = {
      gist_id: this.githubGistId,
      files: {
        [f]: {
          content: calendar,
        }
      }
    };
    console.log('options', options);
    const t = await this.octokit.rest.gists.update(options);
    console.log(t);
  }
}
