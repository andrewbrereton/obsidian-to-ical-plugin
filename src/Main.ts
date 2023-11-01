import { App } from "obsidian";
import { IcalService } from "./IcalService";
import { TaskFinder } from "./TaskFinder";
import { Settings } from "./Model/Settings";
import { Task } from "./Model/Task";
import { GithubClient } from "./GithubClient";

export class Main {
  app: App;
  settings: Settings;
  iCalService: IcalService;
  githubClient: GithubClient;
  tasks: Task[];
  taskFinder: TaskFinder;

  constructor(app: App, settings: Settings) {
    this.app = app;
    this.settings = settings;
    this.iCalService = new IcalService();
    this.githubClient = new GithubClient();
    this.githubClient.setup(this.settings.githubPersonalAccessToken, this.settings.githubGistId, this.settings.filename);
    this.tasks = [];
    this.taskFinder = new TaskFinder(this.app.vault);
  }

  async start() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const taskPromises = [];

    // Iterate over all of the Markdown files in this vault
    for (const file of markdownFiles) {
      // Use cache to get the list items in each Markdown file
      const listItemsCache = this.app.metadataCache.getFileCache(file)?.listItems ?? [];

      // If there are cached list items in this Markdown file then interrogate it further to extract the Tasks
      if (listItemsCache.length) {
        const tasks = await this.taskFinder.findTasks(file, listItemsCache);
        taskPromises.push(tasks);
      }
    }

    const allTasks = await Promise.all(taskPromises);

    this.tasks = [];

    allTasks.forEach((tasks) => {
      tasks.forEach((task) => {
        this.tasks.push(task);
      });
    });

    this.saveCalendar();
  }

  async saveCalendar() {
    const calendar = this.iCalService.getCalendar(this.tasks);
    await this.githubClient.save(calendar);
  }
}
