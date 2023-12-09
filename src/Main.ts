import { App, Events } from "obsidian";
import { IcalService } from "./IcalService";
import { TaskFinder } from "./TaskFinder";
import { Settings, settingsWithoutSecrets } from "./Model/Settings";
import { Task } from "./Model/Task";
import { GithubClient } from "./GithubClient";
import { FileClient } from "./FileClient";
import { log } from "./Logger";
import { TaskDateName } from "./Model/TaskDate";
import { NormalisedTask } from "./Model/NormalisedTask";
import { EVENT_ICAL_NORMALISED_TASKS_UPDATED, trigger } from "./Events";

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
    this.taskFinder = new TaskFinder(this.app.vault, this.settings.howToParseInternalLinks, this.settings.ignoreCompletedTasks);
  }

  async start() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const taskPromises = [];

    log(`Performing a scan`);
    log(`Settings`, { settings: settingsWithoutSecrets(this.settings) });

    log(`Found ${markdownFiles.length} Markdown files`, markdownFiles);

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

    log(`Found ${this.tasks.length} tasks`, this.tasks);

    // Build the calendar
    const calendar = this.iCalService.getCalendar(this.tasks);
    log(`Calendar has been built`, {calendar});

    // Save to Gist
    if (this.settings.isSaveToGistEnabled) {
      log(`Saving calendar to Gist...`);
      await this.saveToGist(calendar);
      log(`Done`);
    } else {
      log(`Skip saving calendar to Gist`);
    }

    // Save to file
    if (this.settings.isSaveToFileEnabled) {
      log(`Saving calendar to file...`);
      await this.saveToFile(calendar);
      log(`Done`);
    } else {
      log(`Skip saving calendar to file`);
    }

    this.normaliseTasks();
  }

  async saveToGist(calendar: string) {
    await this.githubClient.save(calendar);
  }

  async saveToFile(calendar: string) {
    await this.fileClient.save(calendar);
  }

  // The tasks are normalised and then an event is triggered
  // SidebarView handles this event so that it can render the task agenda
  // They are normalised so that we store just the bare minimum
  // Tasks from the past are ignored
  // Tasks are sorted in chronological order
  async normaliseTasks() {
    const normalisedTasks: NormalisedTask[] = [];

    // Normalise
    this.tasks.forEach((task: Task) => {
      // Skip tasks in the past
      if (task.isInThePast() === false) {
        normalisedTasks.push({
          key: task.getDate(null, 'YYYYMMDDTHHmmss'),
          date: task.getDate(null, 'YYYY-MM-DD'),
          summary: task.getSummary(),
          link: task.getLocation(),
        });
      }
    });

    // Sort by key so we're showing the next task first
    normalisedTasks.sort((a: NormalisedTask, b: NormalisedTask) => a.key.localeCompare(b.key));

    // Trigger the custom event to share the news with everyone
    // At this stage the only event handler is SidebarView
    trigger(EVENT_ICAL_NORMALISED_TASKS_UPDATED, normalisedTasks);
  }
}
