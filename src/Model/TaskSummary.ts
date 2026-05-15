export function getSummaryFromMarkdown(markdown: string, howToParseInternalLinks: string): string {
  // Remove recurring task information
  // TODO: Maybe instead of removing the recurring task information, this should support recurring tasks
  markdown = removeRecurringDates(markdown);

  // Internal Links:
  // 1. Bare wikilink:        [[link to document]]
  // 2. Wikilink with title:  [[link to document|Link text]]
  // 3. Markdown:             [Link text](link to document)
  switch (howToParseInternalLinks) {
    case 'KeepTitle':
      markdown = extractWikilinkTitles(markdown);
      markdown = removeBareWikilinks(markdown);
      markdown = extractMarkdownLinkTitles(markdown);
      break;
    case 'PreferTitle':
      markdown = extractWikilinkTitles(markdown);
      markdown = extractWikilinkLinks(markdown);
      markdown = extractMarkdownLinkTitles(markdown);
      break;
    case 'RemoveThem':
      markdown = removeWikilinks(markdown);
      markdown = removeMarkdownLinks(markdown);
      break;
    case 'DoNotModifyThem':
    default:
      // Do nothing
  }

  // Remove emoji dates
  markdown = removeEmojiDates(markdown);

  // Remove Dataview dates
  markdown = removeDataviewDates(markdown);

  // Strip inline time ranges (e.g. "17:00-19:00") only when a date is also present,
  // since TaskDate has anchored that time to the date and produced TimeStart/TimeEnd.
  // Must run before removeDates so the date is still visible for the check.
  markdown = removeTimeRanges(markdown);

  // Remove any leftover dates
  markdown = removeDates(markdown);

  // Trim whitespace
  markdown = trimWhitespace(markdown);

  return markdown;
}

function extractWikilinkTitles(markdown: string): string {
  const regExp = /\[\[[^\]]*\|+([^\]]+)\]\]/gi;
  markdown = markdown.replace(regExp, '$1');

  return markdown;
}

function removeBareWikilinks(markdown: string): string {
  const regExp = /\[{2}([^|\]]+)\]{2}/gi;
  markdown = markdown.replace(regExp, '');

  return markdown;
}

function extractMarkdownLinkTitles(markdown: string): string {
  const regExp = /\[([^\]]+)\]\([^)]+\)/gi;
  markdown = markdown.replace(regExp, '$1');

  return markdown;
}

function extractWikilinkLinks(markdown: string): string {
  const regExp = /\[{2}(.*)\]{2}/gi;
  markdown = markdown.replace(regExp, '$1');
  return markdown;
}

function removeWikilinks(markdown: string): string {
  const regExp = /\[{2}.*\]{2}/gi;
  markdown = markdown.replace(regExp, '');

  return markdown;
}

function removeMarkdownLinks(markdown: string): string {
  const regExp = /\[.*\]\(.*\)/gi;
  markdown = markdown.replace(regExp, '');

  return markdown;
}

function removeRecurringDates(markdown: string): string {
  const regExp = /🔁(.*?)(?=\s(?:➕|⏳|🛫|📅|✅)|\s\d{4}-\d{2}-\d{2}|$)/gi;
  markdown = markdown.replace(regExp, '');

  return markdown;
}

function removeEmojiDates(markdown: string): string {
  const regExp = /\s*➕|⏳|🛫|📅|✅\s?\d{4}-\d{2}-\d{1,2}\s*/gi;
  markdown = markdown.replace(regExp, '');

  return markdown;
}

function removeDataviewDates(markdown: string): string {
  const regExp = /\s*\[(created|scheduled|start|due|completion|cancelled)::\s?\d{4}-\d{2}-\d{1,2}\s*\]/gi;
  markdown = markdown.replace(regExp, '');

  return markdown;
}

function removeDates(markdown: string): string {
  const regExp = /\s*\d{4}-\d{2}-\d{1,2}/gi;
  markdown = markdown.replace(regExp, '');

  return markdown;
}

function removeTimeRanges(markdown: string): string {
  if (!/\d{4}-\d{2}-\d{1,2}/.test(markdown)) {
    return markdown;
  }

  const regExp = /\s*\b(?<!\d{4}-(?:\d{2}-)?)(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?|\d{1,2}\s*[ap]m)(?:\s*-\s*(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?|\d{1,2}\s*[ap]m))?\b\s*/gi;
  return markdown.replace(regExp, ' ');
}

function trimWhitespace(markdown: string): string {
  const regExp = /\s{2,}/g;
  // Replace duplicate whitespace characters with just one
  markdown = markdown.replace(regExp, ' ');

  // Trim any leading or trailing whitespace
  markdown = markdown.trim();

  return markdown;
}
