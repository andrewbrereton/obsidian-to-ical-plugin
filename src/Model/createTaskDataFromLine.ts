import { settings } from 'src/SettingsManager'
import { getTaskDatesFromMarkdown, TaskDate } from './TaskDate'
import { getTaskStatusFromMarkdown, TaskStatus } from './TaskStatus'
import { getSummaryFromMarkdown } from './TaskSummary'
export function createTaskDataFromLine(
  line: string,
  fileUri: string,
  dateOverride: Date | null
) {
  const taskRegExp = /(\*|-)\s*(?<taskStatus>\[.?])\s*(?<summary>.*)\s*/gi
  const dateRegExp = /\b(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi

  const taskMatch = [...line.matchAll(taskRegExp)][0] ?? null

  // This isn't a task. Bail.
  if (taskMatch === null) return null

  const dateMatch = [...line.matchAll(dateRegExp)][0] ?? null

  // This task doesn't have a date and we are not including TODO items. Bail.
  if (
    dateMatch === null &&
    dateOverride === null &&
    settings.isIncludeTodos === false
  ) {
    return null
  }

  // Extract the Task data points from the matches
  const taskStatus = getTaskStatusFromMarkdown(
    taskMatch?.groups?.taskStatus ?? ''
  )

  // Task is done and user wants to ignore completed tasks. Bail.
  if (
    taskStatus === TaskStatus.Done &&
    settings.ignoreCompletedTasks === true
  ) {
    return null
  }

  const taskDates = getTaskDatesFromMarkdown(line, dateOverride)

  // Ignore old tasks is enabled, and all of the task's dates are after the retention period. Bail.
  if (settings.ignoreOldTasks === true) {
    const now = new Date()
    const thresholdDate = new Date(
      now.setDate(now.getDate() - settings.oldTaskInDays)
    )

    const isAllDatesOld = taskDates.every((taskDate: TaskDate) => {
      return taskDate.date < thresholdDate
    })

    if (isAllDatesOld === true) {
      return null
    }
  }

  const summary = getSummaryFromMarkdown(
    taskMatch?.groups?.summary ?? '',
    settings.howToParseInternalLinks
  )

  return { taskStatus, taskDates, summary, fileUri }
}
