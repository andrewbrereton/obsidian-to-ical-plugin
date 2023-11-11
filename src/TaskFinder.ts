import { ListItemCache, TFile, Vault } from "obsidian";
import { Task, createTaskFromLine } from "./Model/Task";

export class TaskFinder {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
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
        .map((line: string) => createTaskFromLine(line, fileUri))
        // Filter out the nulls
        .filter((task: Task | null) => task !== null) as Task[]
        ;

    return tasks;
  }
}
