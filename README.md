# Obsidian to iCal

This is a plugin for [Obsidian](https://obsidian.md) that searches your Obsidian vault for tasks that contain dates, and generates a calendar in iCal format that can be imported into your preferred calendar application.

## How it works

Periodically, the plugin will:

1. Find all tasks in your vault (A valid task is a Markdown checkbox (either checked or not) that contains a date in the format YYYY-MM-DD or YYYY-MM-D),
2. Generate an iCal calendar file that contains all of these tasks,
3. Tasks are appended with an emoji to quickly see their status (✅ completed, 🔲 to do, 🏃 in progress, 🚫 canceled),
4. Optionally, calendar can be saved to your filesystem, and/or
5. Optionally, calendar can be stored on GitHub Gist.

If you choose to store your calendar on Gist, you can then use the URL to your Gist in your preferred calendar application.

Your vault will be scanned every now and then for changes to tasks to keep your calendar up-to-date.

## Support for Obsidian Tasks

This plugin has rudimentary support for [Obsidian Tasks emoji format](https://publish.obsidian.md/tasks/Reference/Task+Formats/Tasks+Emoji+Format) and [Obsidian Tasks dataview format](https://publish.obsidian.md/tasks/Reference/Task+Formats/Dataview+Format). However it is not mandatory.

## Support for Day Planner

This plugin supports [Day Planner](https://github.com/ivan-lednev/obsidian-day-planner) format tasks. If you enable this in the settings, then the date of the task will be taken from the tasks heading, and the start time and end time will be taken from the task. If there is no end time, the default end time will be 30 minutes from the start time.

## Settings

iCal has various settings which I will try to explain.

### Target directory

This allows you to configure the plugin to scan for tasks in certain directories (or folders). For example, you might have a large vault with lots of information, but you only want to a calendar for tasks contains in your "Diary" directory. In this case, you would choose "/Diary".

The default behaviour is to scan the entire vault for tasks, which is the "**/**" option.

### Processing internal links

Obsidian supports two types of [internal link](https://help.obsidian.md/Linking+notes+and+files/Internal+links): wikilinks and markdown.

Wikilinks can look like: `[[Link to document]]` or `[[Link to document|Link title]]`. Markdown links look like `[Link title](Link to document)`.

#### Do not modify them (default)

This option will keep the links in your event just as they appear.

#### Keep the title

This option will keep just the `Link title` and remove the link. If the wikilink does not have a title then it will be removed.

#### Prefer the title

This option will take the `Link title` however if that does not exist, then it will use `Link to document`.

#### Remove them

This option will remove them entirely from your event summary.

### Ignore completed tasks

This is to allow you to exclude completed tasks from being added to your calendar. It will also remove tasks from your calendar once they are marked as completed.

### Add tasks as TODO items to your calendar

By default the tasks discovered in your vault are treated as calendar events. This option allows you to also create calendar todo tasks. You have the option of choosing to just create calendar events, to just create TODO items, or to create both. Previously, there was an option to create just events or events and tasks. This has been expended to include just tasks as well. The default option is to create just calendar events.

Some clients that support TODO items include Google Tasks, Microsoft Outlook, Microsoft To Do, Mozilla Thunderbird with Lightning Calendar, Android CalDAV-Sync, Calendars by Readdle, Todoist and OmniFocus.

### Only tasks without dates are TODO items

Enabling this will mean that only tasks that do not have dates will be created as TODO items. If you disable this, then *every* task (tasks with or without a date) will be added to your calendar as a TODO item.

### Ignore old tasks?

Toggles on or off the functionality where you are able to exclude tasks whose dates are older than the value you specify.

### How many days back to you want to keep old tasks?

If `Ignore old tasks?` is true then you will be asked to set the age in days. Minimum value is 1 day. Maximum value is 3650 days (10 years).

### Which task date should be used?

Tasks can have one or more dates. From either a single raw date in YYYY-MM-DD format, to dates for when a task starts, is scheduled or is due. This setting is to customise which date is chosen when building your iCalendar.

#### Prefer due date (default)

Prefer due date means the following sequence will be followed:

1. If the task has a due date and a start date, they will be the start and end date
1. If the task only has a due date, that will be used
1. If the task only has a start date, that will be used
1. If neither are found, just find any date related to that task

#### Prefer start date

Prefer start date means the following sequence will be followed:

1. If the task only has a start date, that will be used
1. If the task only has a due date, that will be used
1. If neither are found, just find any date related to that task

#### Create an event per start/scheduled/due date

Create an event for each start date, scheduled date and due date associated with a task. This means if your task has all three dates, then three separate events will be created in your calendar.

1. If there is a start date, an event will be created using that date. The summary will be appended with a 🛫.
1. If there is a scheduled date, an event will be created using that date. The summary will be appended with a ⏳.
1. If there is a due date, an event will be created using that date. The summary will be appended with a 📅.
1. If none of the above dates were found, then take any old date that we can find

### Support Day Planner plugin?

Enabling this will tell the plugin to consider [Day Planner plugin](https://github.com/ivan-lednev/obsidian-day-planner) format if tasks are discovered with times in them.

### Save calendar to GitHub Gist?

Enabling this will unlock the [Save calendar to GitHub Gist](README.md#save-calendar-to-gitHub-gist) settings.

### Save calendar to disk?

Enabling this will unlock the [Save calendar to disk](README.md#save-calendar-to-disk) settings.

### Periodically save your calendar?

Enabling this will tell iCal that it should periodically scan your vault for tasks within Markdown files and generate a calendar. It also unlocks the [How often should we parse and save your calendar? (minutes)](README.md#how-often-should-we-parse-and-save-your-calendar?-(minutes)) setting.

### How often should we parse and save your calendar? (minutes)

The number of minutes between each scan to generate and save your calendar. Must be a number between 1 and 1,440 (24 hours).

### Only include tasks with certain tags?

Enabling this will unlock the [Only include tasks that contain these tags](README.md#only-include-tasks-that-contain-these-tags) setting.

### Only include tasks that contain these tags

You can enter one or more tags. Only tasks that contains one or more of these tasks will be included in your calendar. Multiple tags should be separated by a space.

### Exclude tasks with certain tags?

Enabling this will unlock the [Exclude tasks that contain these tags](README.md#exclude-tasks-that-contain-these-tags) setting.

### Exclude tasks that contain these tags

You can enter one or more tags. If a task contains any of these tags, then it will be excluded from your calendar. Multiple tags should be separated by a space.

If you have include tags and exclude tags, then exclude tags take priority.

### Save calendar to GitHub Gist

Saving to GitHub Gist means you will be given a URL that you can import into your calendar applications.

#### GitHub personal access token

To be able to write the calendar file to GitHub Gist, you need to generate a personal access token.

For further information please see [How to generate a GitHub Personal Access Token](README.md#how-to-generate-a-github-personal-access-token).

#### GitHub Gist ID

The Gist ID is the Gist that you want to write your calendar to.

For further information please see [How to generate a GitHub Gist ID](README.md#how-to-generate-a-github-gist-id).

#### GitHub username

This is used only to generate the URL to your GitHub Gist.

#### Filename

This should match the filename that you used when you created the GitHub Gist.

For further information please see [How to generate a GitHub Gist ID](README.md#how-to-generate-a-github-gist-id).

#### Your calendar URL

This is the URL that you need to copy and paste into your preferred calendar application.

### Save calendar to disk

Saving your calendar to disk means you can import it into a desktop application (like Thunderbird) or do further processing if you're that way inclined. For example, maybe you want to email the calendar to someone. I don't know.

### Path

This is the path, relative to the root directory of your vault, in which the calendar file will be written. An empty string means the root directory of your vault.

### Filename

Give the calendar file a name.

### File extension

Choose the extension of the filename.

### Your calendar path

This is just a way to copy the path and filename and extension so it's easy to find on your filesystem.

### Debug mode

This turns on logging so that you can see what the extension is doing. It can be helpful to diagnose what is happening if there are any issues.

In the Obsidian menu, go to View and select Toggle Developer Tools. The log messages will appear in the Console tab.

## How to generate a GitHub Personal Access Token

A GitHub Personal Access Token is a long random string that allows iCal to write to your GitHub Gist on your behalf.

To generate one, do the following:

1. Go to https://github.com/settings/tokens/new
    1. `Note`: Enter something like "Obsidian iCal".
    2. `Expiration`: Best practice is to expire tokens periodically but that would be frustrating. Choose `no expiration` if you want to.
    3. `Select scopes`: Choose `gist` only.
    4. Click `Generate token`
2. Copy the personal access token (It starts in `ghp_`)
3. Paste it into the [GitHub personal access token](README.md#github-personal-access-token) setting.

If your personal access token is leaked, go to the [GitHub tokens page](https://github.com/settings/tokens) and click `Delete`. Then follow these steps again to generate a new one.

## How to generate a GitHub Gist ID

1. Go to here to create a new Gist: https://gist.github.com/
    1. `Gist description`: Enter anything you like. Eg: My calendar that is generated from my Obsidian vault
    2.  `Filename including extension`: You could use `obsidian.ics` or your vault name. Whatever you enter here, you will need to enter it in the iCal settings so it knows which file to write to.
    3. For the contents of the Gist, just put anything in there. The iCal plugin will overwrite it.
    4. Click `Create secret gist`

After you create the Gist, you will see the URL is something like:

```text
https://gist.github.com/andrewbrereton/11c399ce6c0d89c5f8101edb9a2b76d6

                        |------------| |------------------------------|
                           Username                 Gist ID
```

2. Take the `Username` part and enter it in [GitHub username](README.md#github-username) setting.

3. Take the `Gist ID` part and enter it in [GitHub Gist ID](README.md#github-gist-id) setting.

## Compatible calendars

* Google Calendar
* Apple Calendar
* Microsoft Outlook
* Lightning extension for Mozilla Thunderbird and SeaMonkey
* Yahoo! Calendar
* GNU Emacs
* HCL Domino (formerly IBM Notes and Lotus Notes)
* GNOME Evolution
* eM Client
* Novell GroupWise
