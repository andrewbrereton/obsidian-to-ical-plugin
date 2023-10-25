import { App, TFile } from "obsidian";
import { IcalService } from "./IcalService";
import { TaskFinder } from "./TaskFinder";
import { TaskStatus } from "./Model/TaskStatus";
import { Settings } from "./Model/Settings";
import { Task } from "./Model/Task";
import { GithubClient } from "./GithubClient";

export class Main {
  app: App;
  settings: Settings;
  iCalService: IcalService;
  githubClient: GithubClient;
  tasks: Task[];

  constructor(app: App, settings: Settings) {
    this.app = app;
    this.settings = settings;
    this.iCalService = new IcalService();
    this.githubClient = new GithubClient();
    this.githubClient.setup(this.settings.githubPersonalAccessToken, this.settings.githubGistId, this.settings.filename);
    this.tasks = [];
  }

  async start() {
    const markdownFiles = this.findMarkdownFiles();
    const taskPromises = [];

    for (const file of markdownFiles) {
      const tasks = this.findTasks(file);
      taskPromises.push(tasks);
    }

    const allTasks = await Promise.all(taskPromises);

    allTasks.forEach((tasks) => {
      tasks.forEach((task) => {
        this.tasks.push(task);
      });
    });

    this.saveCalendar();
  }

  private findMarkdownFiles(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  private async findTasks(file: TFile): Promise<Task[]> {
    const taskParser = new TaskFinder();
    const markdown = await this.app.vault.read(file);
    const tasks = taskParser.findTasks(markdown);

    return tasks;
  }

  async saveCalendar() {
    const calendar = this.iCalService.getCalendar(this.tasks);
    await this.githubClient.save(calendar);
  }
}
