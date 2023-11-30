export function getSummaryFromMarkdown(markdown: string, howToParseInternalLinks: string): string {
    const recurringRegExp = /🔁(.*?)(?=\s(?:➕|⏳|🛫|📅|✅)|\s\d{4}-\d{2}-\d{2}|$)/gi;
    const emojiDateRegExp = /\s*➕|⏳|🛫|📅|✅\s?\d{4}-\d{2}-\d{1,2}\s*/gi;
    const dateRegExp = /\s*\d{4}-\d{2}-\d{1,2}/gi;

    // Remove recurring task information
    // TODO: Maybe instead of removing the recurring task information, this should support recurring tasks
    markdown = markdown.replace(recurringRegExp, '');

    // Depending on user settings, keep just the title for [[wikilinks|TITLE]] and [TITLE](markdown links)
    if (howToParseInternalLinks === 'KeepTitle') {
        const wikilinksRegExp = /\[\[[^\]]*\|+([^\]]+)\]\]/gi;
        markdown = markdown.replace(wikilinksRegExp, '$1');

        const markdownLinksRegExp = /\[([^\]]+)\]\([^\)]+\)/gi;
        markdown = markdown.replace(markdownLinksRegExp, '$1');
    }

    // Depending on user settings, remove [[wikilinks]] and [markdown links](markdown links)
    // Also do this for KeepTitle so that we clean up and dangling internal links
    if (howToParseInternalLinks === 'KeepTitle' || howToParseInternalLinks === 'RemoveThem') {
        const wikilinksRegExp = /\[{2}.*\]{2}/gi;
        markdown = markdown.replace(wikilinksRegExp, '');

        const markdownLinksRegExp = /\[.*\]\(.*\)/gi;
        markdown = markdown.replace(markdownLinksRegExp, '');
    }

    // Remove emoji dates
    markdown = markdown.replace(emojiDateRegExp, '');

    // Remove dates
    markdown = markdown.replace(dateRegExp, '');

    // Trim whitespace
    markdown = markdown.trim();

    return markdown;
  }
