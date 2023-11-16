import { App } from "obsidian";
import { IcalService } from "./IcalService";
import { TaskFinder } from "./TaskFinder";
import { Settings } from "./Model/Settings";
import { Task } from "./Model/Task";
import { GithubClient } from "./GithubClient";
import { FileClient } from "./FileClient";
import { log } from "./Logger";

export class Main {
  app: App;
  settings: Settings;
  iCalService: IcalService;
  githubClient: GithubClient;
  fileClient: FileClient;
  tasks: Task[];
  taskFinder: TaskFinder;

  constructor(app: App, settings: Settings) {
    this.app = app;
    this.settings = settings;
    this.iCalService = new IcalService();
    this.githubClient = new GithubClient(this.settings.githubPersonalAccessToken, this.settings.githubGistId, this.settings.filename);
    this.fileClient = new FileClient(this.app.vault, this.settings.savePath, this.settings.saveFileName, this.settings.saveFileExtension);
    this.tasks = [];
    this.taskFinder = new TaskFinder(this.app.vault);
  }

  async start() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const taskPromises = [];

    log(`Found ${markdownFiles.length} Markdown files`);

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

    // Process all of the tasks that were discovered
    const allTasks = await Promise.all(taskPromises);

    this.tasks = [];

    allTasks.forEach((tasks) => {
      tasks.forEach((task) => {
        this.tasks.push(task);
      });
    });

    log(`Found ${this.tasks.length} Tasks`);

    // Build the calendar
    const calendar = this.iCalService.getCalendar(this.tasks);

    // Save to Gist
    if (this.settings.isSaveToGistEnabled) {
      log(`Saving to Gist...`);
      await this.saveToGist(calendar);
      log(`Done`);
    }

    // Save to file
    if (this.settings.isSaveToFileEnabled) {
      log(`Saving to File...`);
      await this.saveToFile(calendar);
      log(`Done`);
    }
  }

  async saveToGist(calendar: string) {
    await this.githubClient.save(calendar);
  }

  async saveToFile(calendar: string) {
    await this.fileClient.save(calendar);
  }
}
