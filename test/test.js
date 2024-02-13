const ICAL = require('ical.js');
const fs = require('fs').promises;
const path = require('path');

describe('Obsidian iCal Plugin', () => {
  let jcalData;
  let taskIds = [];

  beforeAll(async () => {
    const outputPath = path.join('test', 'obsidian-ical-plugin.ics');
    const icsContent = await fs.readFile(outputPath, 'utf-8');
    jcalData = ICAL.parse(icsContent);

    for (let i = 21; i <= 128; i++) {
      taskIds.push(i);
    }
  });

  test('iCalendar file structure', () => {
    expect(jcalData[0]).toBe('vcalendar');

    const prodid = jcalData[1].find(prop => prop[0] === 'prodid')[3];
    const versionRegex = /-\/\/Andrew Brereton\/\/obsidian-ical-plugin v(\d+\.\d+\.\d+)/;
    expect(prodid).toMatch(versionRegex);

    expect(jcalData[1]).toContainEqual(['version', {}, 'text', '2.0']);
  });

  test('All tasks are present in the iCalendar file', () => {
    // Ensure taskIds is populated before running this test
    expect(taskIds.length).toBeGreaterThan(0); // Sanity check to ensure taskIds is not empty

    const taskPresence = taskIds.map(id => {
      return jcalData[2].some(event => {
        const summary = event[1].find(prop => prop[0] === 'summary');
        return summary && summary[3].includes(`id=${id},`);
      });
    });

    // Check if every task ID has a corresponding event
    const allTasksPresent = taskPresence.every(isPresent => isPresent === true);
    expect(allTasksPresent).toBe(true);
  });

  describe('Check specific task details', () => {
    const testCases = [
      { id: 21, expectedSummaryIncludes: 'todo, bare date' },
      { id: 22, expectedSummaryIncludes: '✅' },
      { id: 23, expectedSummaryIncludes: '🚫' },
      { id: 24, expectedSummaryIncludes: '🏃' },
      { id: 25, expectedSummaryIncludes: '🔲' },
      { id: 27, expectedSummaryIncludes: '#tag' },
      { id: 29, expectedSummaryIncludes: ', wikilink link bare,' },
      { id: 33, expectedSummaryIncludes: ', wikilink title,' },
      { id: 37, expectedSummaryIncludes: 'markdown title,' },
      { id: 47, expectedSummaryIncludes: 'cancelled,' },
      { id: 71, expectedSummaryIncludes: 'wikilink link bare' },
      { id: 77, expectedSummaryIncludes: ', markdown title' },
      { id: 88, expectedSummaryIncludes: 'in progress' },
      { id: 124, expectedSummaryIncludes: 'in progress' },
      { id: 127, expectedSummaryIncludes: 'cancelled' },
    ];

    testCases.forEach(({ id, expectedSummaryIncludes }) => {
      test(`Task id=${id} summary includes "${expectedSummaryIncludes}"`, () => {
        const event = jcalData[2].find(event => event[1].some(prop => prop[0] === 'summary' && prop[3].includes(`id=${id},`)));
        expect(event).toBeDefined();
        const summary = event[1].find(prop => prop[0] === 'summary')[3];
        expect(summary).toContain(expectedSummaryIncludes);
      });
    });
  });

  describe('Date formatting for tasks with dates', () => {
    const testCases = [21,23,44,48,56,67,73,79,80,85,91,92,101,104,105,120];
    const expectedDate = '20240101'; // Expected date format without time
    testCases.forEach((id) => {
      test(`Date formatting for tasks with dates (id=${id})`, () => {
        jcalData[2].forEach((event) => {
          const summary = event[1].find(prop => prop[0] === 'summary');
          if (summary && summary[3].includes(`id=${id}`)) {
            const dtstart = event[1].find(prop => prop[0] === 'dtstart')[3];
            const dateOnly = dtstart.split('T')[0].replace(/-/g, ''); // Extracts date part and formats to 'YYYYMMDD'
            expect(dateOnly).toBe(expectedDate); // Compares date part only
          }
        });
      });
    });
  });

  afterAll(async () => {
  // Cleanup: delete the generated .ics file, if necessary
  // await fs.unlink(outputPath);
  });
});
