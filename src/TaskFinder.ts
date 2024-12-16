import { ListItemCache, TFile, Vault } from 'obsidian'
import { Task, createTaskFromLine } from './Model/Task'
import { settings } from './SettingsManager'
import { Headings } from './Model/Headings'

export class TaskFinder {
  private vault: Vault

  constructor(vault: Vault) {
    this.vault = vault
  }

  async findTasks(
    file: TFile,
    listItemsCache: ListItemCache[],
    headings: Headings | undefined
  ): Promise<Task[]> {
    const fileCachedContent: string = await this.vault.cachedRead(file)
    const lines: string[] = fileCachedContent.split('\n')
    const fileUri: string =
      'obsidian://open?vault=' + file.vault.getName() + '&file=' + file.path
    let dateOverride: Date | null = null

    const tasks: Task[] = listItemsCache
      // Get the position of each list item
      .map((markdownListItem: ListItemCache) => {
        return markdownListItem.position.start.line
      })
      // Get the line and the heading from the line number
      .map((markdownLineNumber: number) => {
        return {
          markdownLineNumber: markdownLineNumber,
          markdownLine: lines[markdownLineNumber],
        }
      })
      // Create a Task from the line
      .map((lineAndHeading) => {
        // If the Day Planner plugin format is enabled and the line contains at least one time,
        // then we need to go back up the lines to find the heading which has the date.
        if (
          settings.isDayPlannerPluginFormatEnabled &&
          headings?.hasHeadings()
        ) {
          if (this.hasTimes(lineAndHeading.markdownLine)) {
            const heading = headings.getHeadingForMarkdownLineNumber(
              lineAndHeading.markdownLineNumber
            )
            dateOverride = heading?.getDate ?? null
          }
        }

        // If the user wants to only include tasks with certain tags, filter them here
        if (settings.isIncludeTasksWithTags) {
          if (
            !this.hasTag(
              lineAndHeading.markdownLine,
              settings.includeTasksWithTags
            )
          ) {
            return null
          }
        }

        // If the user wants to exclude tasks with certain tags, filter them here
        if (settings.isExcludeTasksWithTags) {
          if (
            this.hasTag(
              lineAndHeading.markdownLine,
              settings.excludeTasksWithTags
            )
          ) {
            return null
          }
        }

        return createTaskFromLine(
          lineAndHeading.markdownLine,
          fileUri,
          dateOverride
        )
      })
      // Filter out the nulls
      .filter((task: Task | null) => task !== null) as Task[]
    return tasks
  }

  hasTimes(line: string): boolean {
    // Time detection RegExp is related to Daily Planner plugin:
    // https://github.com/ivan-lednev/obsidian-day-planner/blob/HEAD/src/regexp.ts

    // This regular expression is insane
    // It matches on various time formats (HH:MM, HH:MM:SS, HHam/pm, etc)
    // It also does not match the day portion of dates in the yyyy-mm-dd format
    const timeRegExp =
      /\b((?<!\d{4}-\d{2}-)\d{1,2}:(\d{2})(?::\d{2})?\s*(?:[ap][m])?|(?<!\d{4}-\d{2}-)\d{1,2}\s*[ap][m])\b/gi

    return timeRegExp.test(line)
  }

  // Does this line contain any of the tags provided?
  hasTag(line: string, tags: string): boolean {
    if (!tags.includes(' ')) {
      // If tag inclusion/exclusion is enabled then this function will be called for every task that is discovered.
      // This is a small optimisation so that if there is only one tag, then skip the split() and some() loop calls.
      return line.includes(tags)
    }

    return tags.split(' ').some((tag) => line.includes(tag))
  }
}
