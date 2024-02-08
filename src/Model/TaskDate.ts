export class TaskDate {
  date: Date;
  name: TaskDateName;

  constructor(date: Date, name: TaskDateName) {
    this.date = date;
    this.name = name;
  }
}

export enum TaskDateName {
  Created = 'Created',
  Scheduled = 'Scheduled',
  Start = 'Start',
  Due = 'Due',
  Done = 'Done',
  Unknown = 'Unknown'
}

const TaskDateEmojiMap: Record<TaskDateName, string> = {
  [TaskDateName.Created]: '➕',
  [TaskDateName.Scheduled]: '⏳',
  [TaskDateName.Start]: '🛫',
  [TaskDateName.Due]: '📅',
  [TaskDateName.Done]: '✅',
  [TaskDateName.Unknown]: '',
};

const EmojiToTaskDateNameMap: Record<string, TaskDateName> = Object.entries(TaskDateEmojiMap).reduce(
  (acc, [key, emoji]) => {
    acc[emoji] = key as TaskDateName;
    return acc;
  },
  {} as Record<string, TaskDateName>
);

// Unused. Uncomment if needed in the future
// function getEmojiFromTaskName(taskDateName: TaskDateName): string {
//   return TaskDateEmojiMap[taskDateName] || '';
// }

function getTaskNameFromEmoji(emoji: string): TaskDateName {
  return EmojiToTaskDateNameMap[emoji] ?? TaskDateName.Unknown;
}

// Fixes #42
// If dates are stored in [Dataview Format](https://publish.obsidian.md/tasks/Reference/Task+Formats/Dataview+Format)
// then let's convert it to emoji format before continuing
function convertDataviewToEmoji(markdown: string): string {
  const dataviewFormatCreated = /\[created::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatScheduled = /\[scheduled::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatStart = /\[start::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatDue = /\[due::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatDone = /\[completion::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;
  const dataviewFormatCancelled = /\[cancelled::\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\s?\]/gi;

  markdown = markdown.replace(dataviewFormatCreated, (match, year, month, day) => {
    return `➕ ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatScheduled, (match, year, month, day) => {
    return `⏳ ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatStart, (match, year, month, day) => {
    return `🛫 ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatDue, (match, year, month, day) => {
    return `📅 ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatDone, (match, year, month, day) => {
    return `✅ ${year}-${month}-${day}`;
  });

  markdown = markdown.replace(dataviewFormatCancelled, (match, year, month, day) => {
    return `❌ ${year}-${month}-${day}`;
  });

  return markdown;
}

export function getTaskDatesFromMarkdown(markdown: string): TaskDate[] {
  // Convert Dataview Format to Emoji Format
  markdown = convertDataviewToEmoji(markdown);

  const dateRegExp = /(?<emoji>➕|⏳|🛫|📅|✅)?\s?(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;
  const dateMatches = [...markdown.matchAll(dateRegExp)];

  const taskDates = dateMatches
    .filter((dateMatch) => {
      // Validate (emoji is optional)
      return  dateMatch?.groups?.day &&
        dateMatch?.groups?.month &&
        dateMatch?.groups?.year;
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

  return taskDates;
}
