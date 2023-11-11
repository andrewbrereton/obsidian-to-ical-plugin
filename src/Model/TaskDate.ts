export class TaskDate {
  date: Date
  name: TaskDateName

  constructor(date: Date, name: TaskDateName) {
    this.date = date;
    this.name = name;
  }
};

export enum TaskDateName {
  Created = 'Created',
  Scheduled = 'Scheduled',
  Start = 'Start',
  Due = 'Due',
  Done = 'Done',
  Unknown = 'Unknown'
};

const TaskDateEmojiMap: Record<TaskDateName, string> = {
  [TaskDateName.Created]: "➕",
  [TaskDateName.Scheduled]: "⏳",
  [TaskDateName.Start]: "🛫",
  [TaskDateName.Due]: "📅",
  [TaskDateName.Done]: "✅",
  [TaskDateName.Unknown]: "",
}

const EmojiToTaskDateNameMap: Record<string, TaskDateName> = Object.entries(TaskDateEmojiMap).reduce(
  (acc, [key, emoji]) => {
    acc[emoji] = key as TaskDateName;
    return acc;
  },
  {} as Record<string, TaskDateName>
)

function getEmojiFromTaskName(taskDateName: TaskDateName): string {
  return TaskDateEmojiMap[taskDateName] || '';
}

function getTaskNameFromEmoji(emoji: string): TaskDateName {
  return EmojiToTaskDateNameMap[emoji] ?? TaskDateName.Unknown;
}

export function getTaskDatesFromMarkdown(markdown: string): TaskDate[] {
  const dateRegExp = /(?<emoji>➕|⏳|🛫|📅|✅)?\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;
  const dateMatches = [...markdown.matchAll(dateRegExp)] ?? null;

  const taskDates = dateMatches
    .filter((dateMatch) => {
      // Validate (emoji is optional)
      return  dateMatch?.groups?.day &&
        dateMatch?.groups?.month &&
        dateMatch?.groups?.year
    })
    .map((dateMatch) => {
      // Create TaskDate
      const taskDateName = getTaskNameFromEmoji(dateMatch?.groups?.emoji ?? '');
      const year = parseInt(dateMatch?.groups?.year ?? '', 10);
      const monthIndex = parseInt(dateMatch?.groups?.month ?? '', 10) - 1;
      const day = parseInt(dateMatch?.groups?.day ?? '', 10);
      const date = new Date(year, monthIndex, day);

      return new TaskDate(date, taskDateName);
    });

  console.log({taskDates});

  return taskDates;
}

export function getSummaryFromMarkdown(markdown: string): string {
  const recurringRegExp = /🔁.*\s+[➕|⏳|🛫|📅|✅]?/gi;
  const emojiDateRegExp = /\s*➕|⏳|🛫|📅|✅\s?\d{4}-\d{2}-\d{1,2}\s*/gi;
  const dateRegExp = /\s*\d{4}-\d{2}-\d{1,2}/gi;

  // Remove recurring task information
  // TODO: Maybe instead of removing the recurring task informatin, this should support recurring tasks
  markdown = markdown.replace(recurringRegExp, '');

  // Remove emoji dates
  markdown = markdown.replace(emojiDateRegExp, '');

  // Remove dates
  markdown = markdown.replace(dateRegExp, '');

  // Trim whitespace
  markdown = markdown.trim();

  return markdown;
}
