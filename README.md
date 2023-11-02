# Obsidian to iCal

This is a plugin for [Obsidian](https://obsidian.md) that searches your Obsidian vault for tasks that contain dates, and generates a calendar in iCal format that can be imported into your preferred calendar application.

## How it works

Periodically, the plugin will:

1. Find all tasks in your vault (A valid task is a Markdown checkbox (either checked or not) that contains a date in the format YYYY-MM-DD),
2. Generate an iCal calendar file that contains all of these tasks,
3. Tasks are appended with an emoji to quickly see their status (✅ completed, 🔲 to do, 🏃 in progress, 🚫 canceled),
4. Upload the iCal calendar to GitHub Gist.

You can then use the URL to your Gist in your preferred calendar application.

Your vault will be scanned every now and then for changes to tasks to keep your calendar up-to-date. Your calendar application will periodically query your iCal calendar stored on GitHub. So there can be a short lag between when a task is added to when you will see it in your calendar.

## Support for Obsidian Tasks

This plugin has rudimentary support for [Obsidian Tasks emoji format](https://publish.obsidian.md/tasks/Reference/Task+Formats/Tasks+Emoji+Format).

## Compatible calendars

* Google Calendar
* Apple Calendar
* HCL Domino (formerly IBM Notes and Lotus Notes)
* Yahoo! Calendar
* GNU Emacs
* GNOME Evolution
* eM Client
* Lightning extension for Mozilla Thunderbird and SeaMonkey
* Microsoft Outlook
* Novell GroupWise
