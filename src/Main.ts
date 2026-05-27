import { App } from 'obsidian';
import { FileClient } from './FileClient';
import { GithubClient } from './GithubClient';
import { ApiClient, apiClient } from './ApiClient';
import { IcalService } from './IcalService';
import { log } from './Logger';
import { Task } from './Model/Task';
import { settings } from './SettingsManager';
import { StatusBar } from './StatusBar';
import { TaskFinder } from './TaskFinder';
import { Headings } from './Model/Headings';

export class Main {
  app: App;
  statusBar: StatusBar;
  iCalService: IcalService;
  githubClient: GithubClient;
  fileClient: FileClient;
  tasks: Task[];
  taskFinder: TaskFinder;

  constructor(app: App, statusBar: StatusBar) {
    this.app = app;
    this.statusBar = statusBar;
    this.iCalService = new IcalService();
    this.githubClient = new GithubClient();
    this.fileClient = new FileClient(this.app.vault);
    this.tasks = [];
    this.taskFinder = new TaskFinder(this.app.vault);
  }

  // Construct an ApiClient on demand so each call reads the current
  // settings.secretKey. A long-lived snapshot would go stale the moment the
  // user updates their key in Settings; the ValidationCache singleton handles
  // caching across instances so there's no per-call performance cost.
  get apiClient(): ApiClient {
    return apiClient(this.app.vault.getName(), settings.secretKey);
  }

  async start() {
    try {
      await this.scanAndSave();
    } catch (error) {
      log('Unexpected failure during scan/save', error);
      this.statusBar.scanError(error);
    }
  }

  private async scanAndSave() {
    this.statusBar.scanning();
    let markdownFiles = this.app.vault.getMarkdownFiles();

    // Filter files based on the root path setting
    if (settings.rootPath !== '/') {
      markdownFiles = markdownFiles.filter(file =>
        file.path.startsWith(settings.rootPath)
      );
    }

    const taskPromises: Promise<Task[]>[] = [];

    log('Performing a scan');
    log('Settings', { settings: settings.settingsWithoutSecrets() });

    // Intentionally omit `settings` from the second arg. The SettingsManager
    // has getters for secretKey / githubPersonalAccessToken that resolve
    // against localStorage when inspected in DevTools — passing it raw here
    // would defeat the redaction that line above already prints.
    log(`Found ${markdownFiles.length} Markdown files in ${settings.rootPath}`, { markdownFiles });

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

        taskPromises.push(this.taskFinder.findTasks(file, listItemsCache, headings));
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
    this.statusBar.building(this.tasks.length);

    // Build the calendar
    const calendar = this.iCalService.getCalendar(this.tasks);
    log('Calendar has been built', {calendar});

    if (settings.isSaveToGistEnabled) {
      this.statusBar.saving('Gist');
      log('Saving calendar to Gist...');
      try {
        await this.saveToGist(calendar);
        log('Done');
      } catch (error) {
        log('Failed to save calendar to Gist', error);
        this.statusBar.saveError('Gist', error);
      }
    } else {
      log('Skip saving calendar to Gist');
    }

    if (settings.isSaveToFileEnabled) {
      this.statusBar.saving('File');
      log('Saving calendar to file...');
      try {
        await this.saveToFile(calendar);
        log('Done');
      } catch (error) {
        log('Failed to save calendar to file', error);
        this.statusBar.saveError('File', error);
      }
    } else {
      log('Skip saving calendar to file');
    }

    if (settings.isSaveToWebEnabled) {
      this.statusBar.saving('Web');
      log('Saving calendar to web...');
      try {
        await this.saveToWeb(calendar);
        log('Done');
      } catch (error) {
        log('Failed to save calendar to web', error);
        this.statusBar.saveError('Web', error);
      }
    } else {
      log('Skip saving calendar to web');
    }

    this.statusBar.synced();
  }

  async saveToGist(calendar: string) {
    await this.githubClient.save(calendar);
  }

  async saveToFile(calendar: string) {
    await this.fileClient.save(calendar);
  }

  async saveToWeb(calendar: string) {
    const response = await this.apiClient.save(calendar);
    log('Calendar saved to web successfully:', response.url);
    return response;
  }

  isSyncthingConflictFile(filename: string) {
    const regExp = /.+\.sync-conflict-.+\.md/gi;

    return regExp.test(filename);
  }
}
