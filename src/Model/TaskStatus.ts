export enum TaskStatus {
  ToDo,
  Done,
  InProgress,
  Cancelled,
}

// Support status collection themes
// Taken from Obsidian Tasks docs:
// https://publish.obsidian.md/tasks/Reference/Status+Collections/About+Status+Collections
export function getTaskStatusFromMarkdown(markdown: string): TaskStatus {
  switch (markdown) {
    case '[-]':
      return TaskStatus.Cancelled
    case '[/]':
    case '[d]':
      return TaskStatus.InProgress
    case '[x]':
    case '[X]':
      return TaskStatus.Done
    default:
      return TaskStatus.ToDo
  }
}

export function getTaskStatusEmoji(taskStatus: TaskStatus): string {
  switch (taskStatus) {
    case TaskStatus.Cancelled:
      return '🚫'
    case TaskStatus.Done:
      return '✅'
    case TaskStatus.InProgress:
      return '🏃'
    default:
      return '🔲'
  }
}
