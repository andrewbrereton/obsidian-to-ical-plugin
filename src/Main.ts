import { App, TFile } from 'obsidian';
import { FileClient } from './FileClient';
import { GithubClient } from './GithubClient';
import { IcalService } from './IcalService';
import { log } from './Logger';
import { Task } from './Model/Task';
import { settings } from './SettingsManager';
import { TaskFinder } from './TaskFinder';
import { Heading } from './Model/Heading';
import { Headings } from './Model/Headings';

export class Main {
  app: App;
  iCalService: IcalService;
  githubClient: GithubClient;
  fileClient: FileClient;
  tasks: Task[];
  taskFinder: TaskFinder;

  constructor(app: App) {
    this.app = app;
    this.iCalService = new IcalService();
    this.githubClient = new GithubClient();
    this.fileClient = new FileClient(this.app.vault);
    this.tasks = [];
    this.taskFinder = new TaskFinder(this.app.vault);
  }

  async start() {
    const markdownFiles = this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(settings.rootFolder));
    const taskPromises = [];

    log('Performing a scan');
    log('Settings', { settings: settings.settingsWithoutSecrets() });

    log(`Found ${markdownFiles.length} Markdown files`, markdownFiles);

    // Iterate over all of the Markdown files in this vault
    for (const file of markdownFiles) {
      // Skip SyncThing sync conflict files
      if (this.isSyncthingConflictFile(file.name)) {
        log('SyncThing sync conflict file. Skipping', file);
        continue;
      }

      // Use cache to get the list items in each Markdown file
      const listItemsCache = this.app.metadataCache.getFileCache(file)?.listItems ?? [];

      // If there are cached list items in this Markdown file then interrogate it further to extract the Tasks
      if (listItemsCache.length) {
        let headings;
        // If the user has enabled Day Planner format, then go and get all the Headings in this Markfile file
        if (settings.isDayPlannerPluginFormatEnabled) {
          const markdownHeadings = this.app.metadataCache.getFileCache(file)?.headings ?? [];

          if (markdownHeadings.length) {
            headings = new Headings(markdownHeadings);
          }
        }

        const tasks = await this.taskFinder.findTasks(file, listItemsCache, headings);

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
    log('Calendar has been built', {calendar});

    // Save to Gist
    if (settings.isSaveToGistEnabled) {
      log('Saving calendar to Gist...');
      await this.saveToGist(calendar);
      log('Done');
    } else {
      log('Skip saving calendar to Gist');
    }

    // Save to file
    if (settings.isSaveToFileEnabled) {
      log('Saving calendar to file...');
      await this.saveToFile(calendar);
      log('Done');
    } else {
      log('Skip saving calendar to file');
    }
  }

  async saveToGist(calendar: string) {
    await this.githubClient.save(calendar);
  }

  async saveToFile(calendar: string) {
    await this.fileClient.save(calendar);
  }

  isSyncthingConflictFile(filename: string) {
    const regExp = /.+\.sync-conflict-.+\.md/gi;

    return regExp.test(filename);
  }
}
