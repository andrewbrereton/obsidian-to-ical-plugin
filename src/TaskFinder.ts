import { ListItemCache, TFile, Vault } from 'obsidian';
import { Task, createTaskFromLine } from './Model/Task';

export class TaskFinder {
  private vault: Vault;
  private howToParseInternalLinks: string;
  private ignoreCompletedTasks: boolean;
  private ignoreOldTasks: boolean;
  private oldTaskInDays: number
  private isIncludeTodos: boolean

  constructor(vault: Vault, howToParseInternalLinks: string, ignoreCompletedTasks: boolean, ignoreOldTasks: boolean, oldTaskInDays: number, isIncludeTodos: boolean) {
    this.vault = vault;
    this.howToParseInternalLinks = howToParseInternalLinks;
    this.ignoreCompletedTasks = ignoreCompletedTasks;
    this.ignoreOldTasks = ignoreOldTasks;
    this.oldTaskInDays = oldTaskInDays;
    this.isIncludeTodos = isIncludeTodos;
  }

  async findTasks(file: TFile, listItemsCache: ListItemCache[]): Promise<Task[]> {
    const fileCachedContent: string = await this.vault.cachedRead(file);
    const lines: string[] = fileCachedContent.split('\n');
    const fileUri: string = 'obsidian://open?vault=' + file.vault.getName() + '&file=' + file.path;

    const tasks: Task[] = listItemsCache
      // Get the position of each list item
      .map((listItemCache: ListItemCache) => listItemCache.position.start.line)
      // Get the line
      .map((idx) => lines[idx])
      // Create a Task from the line
      .map((line: string) => createTaskFromLine(line, fileUri, this.howToParseInternalLinks, this.ignoreCompletedTasks, this.ignoreOldTasks, this.oldTaskInDays, this.isIncludeTodos))
      // Filter out the nulls
      .filter((task: Task | null) => task !== null) as Task[]
      ;

    return tasks;
  }
}
