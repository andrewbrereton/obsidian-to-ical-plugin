import { HeadingCache } from 'obsidian';
import { Heading } from './Heading';

export class Headings {
  private headings: Heading[] = [];

  constructor(markdownHeadings: HeadingCache[]) {
    this.setHeadings(markdownHeadings);
  }

  setHeadings(markdownHeadings: HeadingCache[]) {
    markdownHeadings.forEach((markdownHeading: HeadingCache) => {
      const dateRegExp = /\b(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{1,2})\b/gi;
      const dateMatches = [...markdownHeading.heading.matchAll(dateRegExp)][0];

      if (typeof dateMatches === 'undefined') {
        return null;
      }

      const line = markdownHeading.position.start.line ?? 0;

      const year = parseInt(dateMatches?.groups?.year ?? '', 10);
      const monthIndex = parseInt(dateMatches?.groups?.month ?? '', 10) - 1;
      const day = parseInt(dateMatches?.groups?.day ?? '', 10);
      const date = new Date(year, monthIndex, day);

      this.addHeading(new Heading(date, line));
    });
  }

  addHeading(heading: Heading) {
    console.log({heading});
    // Find the correct position to insert the new heading to maintain the sorted order
    const insertIndex = this.headings.findIndex(h => h.getLine < heading.getLine);

    if (insertIndex === -1) {
      // If no such position exists, push to the end of the array
      this.headings.push(heading);
    } else {
      // Otherwise, insert the heading at the found position
      this.headings.splice(insertIndex, 0, heading);
    }
  }

  hasHeadings(): boolean {
    return this.headings.length > 0;
  }

  getHeadingForMarkdownLineNumber(markdownLineNumber: number): Heading | undefined {
    // Array is already sorted in descending order, so we can directly find the heading
    return this.headings.find((heading) => heading.getLine <= markdownLineNumber);
  }
}
