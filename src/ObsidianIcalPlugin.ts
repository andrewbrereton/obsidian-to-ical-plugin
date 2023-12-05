import {
  App,
  ButtonComponent,
  DropdownComponent,
  Plugin,
  PluginSettingTab,
  Setting,
  TextComponent,
  ToggleComponent
} from "obsidian";
import * as path from "path";
import { Main } from "src/Main";
import { Settings, DEFAULT_SETTINGS, HOW_TO_PARSE_INTERNAL_LINKS } from "src/Model/Settings";
import { logger, log } from './Logger';

export default class ObsidianIcalPlugin extends Plugin {
  settings: Settings;
  main: Main;
  periodicSaveInterval: number|null;

  async onload() {
    await this.loadSettings();

    logger(this.settings.isDebug);
    log(`Logger initialised`);

    // // This creates an icon in the left ribbon.
    // const ribbonIconEl = this.addRibbonIcon(
    //   "calendar-days",
    //   "Obsidian to iCal",
    //   (evt: MouseEvent) => {
    //     // Called when the user clicks the icon.
    //     new Notice("This is a notice!");
    //   }
    // );

    // // Perform additional things with the ribbon
    // ribbonIconEl.addClass("my-plugin-ribbon-class");

    // // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    // const statusBarItemEl = this.addStatusBarItem();
    // statusBarItemEl.setText("Status Bar Text");

    // // This adds a simple command that can be triggered anywhere
    // this.addCommand({
    //   id: "open-sample-modal-simple",
    //   name: "Open sample modal (simple)",
    //   callback: () => {
    //     new SampleModal(this.app).open();
    //   },
    // });
    // // This adds an editor command that can perform some operation on the current editor instance
    // this.addCommand({
    //   id: "sample-editor-command",
    //   name: "Sample editor command",
    //   editorCallback: (editor: Editor, view: MarkdownView) => {
    //     console.log(editor.getSelection());
    //     editor.replaceSelection("Sample Editor Command");
    //   },
    // });

    // // This adds a complex command that can check whether the current state of the app allows execution of the command
    // this.addCommand({
    //   id: "open-sample-modal-complex",
    //   name: "Open sample modal (complex)",
    //   checkCallback: (checking: boolean) => {
    //     // Conditions to check
    //     const markdownView =
    //       this.app.workspace.getActiveViewOfType(MarkdownView);
    //     if (markdownView) {
    //       // If checking is true, we're simply "checking" if the command can be run.
    //       // If checking is false, then we want to actually perform the operation.
    //       if (!checking) {
    //         new SampleModal(this.app).open();
    //       }

    //       // This command will only show up in Command Palette when the check function returns true
    //       return true;
    //     }
    //   },
    // });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingTab(this.app, this));

    // // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // // Using this function will automatically remove the event listener when this plugin is disabled.
    // this.registerDomEvent(document, "click", (evt: MouseEvent) => {
    //   console.log("click", evt);
    // });

    this.main = new Main(this.app, this.settings);
    await this.main.start();

    this.configurePeriodicSave();
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Trigger a save every now and then
configurePeriodicSave() {
    if (this.settings.isPeriodicSaveEnabled) {
      log(`Periodic save enabled and will run every ${this.settings.periodicSaveInterval} minute(s)`);
      this.periodicSaveInterval = window.setInterval(async () => {
        log(`Periodic save triggers every ${this.settings.periodicSaveInterval} minute(s)`);
        await this.main.start();
      }, this.settings.periodicSaveInterval * 1000 * 60);

      // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
      this.registerInterval(this.periodicSaveInterval);
    } else {
      log(`Periodic save disabled`);
      if (this.periodicSaveInterval ?? 0 > 0) {
        window.clearInterval(this.periodicSaveInterval ?? 0);
        this.periodicSaveInterval = null;
      }
    }
  }
}

// class SampleModal extends Modal {
//   constructor(app: App) {
//     super(app);
//   }

//   onOpen() {
//     const { contentEl } = this;
//     contentEl.setText("Woah!");
//   }

//   onClose() {
//     const { contentEl } = this;
//     contentEl.empty();
//   }
// }

class SettingTab extends PluginSettingTab {
  plugin: ObsidianIcalPlugin;

  constructor(app: App, plugin: ObsidianIcalPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('p', { cls: 'setting-item-description', text: 'This plugin finds all of the tasks in your vault that contain a date and generates a calendar in iCalendar format. The calendar can be saved to a file and/or saved in a Gist on GitHub so that it can be added to your iCalendar calendar of choice.' });

    new Setting(containerEl)
      .setName("Processing internal links")
      .setDesc("How should [[wikilinks]] and [markdown links](markdown links) be processed if they are encountered in a task?")
      .addDropdown((dropdown: DropdownComponent) =>
        dropdown
          .addOptions(HOW_TO_PARSE_INTERNAL_LINKS)
          .setValue(this.plugin.settings.howToParseInternalLinks)
          .onChange(async (value) => {
            this.plugin.settings.howToParseInternalLinks = value;
            await this.plugin.saveSettings();
            this.display();
          })
        );

    new Setting(containerEl)
      .setName("Ignore completed tasks")
      .setDesc("Choose if you want your calendar to ignore tasks that have been completed.")
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(this.plugin.settings.ignoreCompletedTasks)
          .onChange(async (value) => {
            this.plugin.settings.ignoreCompletedTasks = value;
            await this.plugin.saveSettings();
            this.display();
          })
        );

    new Setting(containerEl)
      .setName("Save calendar to GitHub Gist?")
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(this.plugin.settings.isSaveToGistEnabled)
          .onChange(async (value) => {
            this.plugin.settings.isSaveToGistEnabled = value;
            await this.plugin.saveSettings();
            this.display();
          })
        );

    new Setting(containerEl)
      .setName("Save calendar to disk?")
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(this.plugin.settings.isSaveToFileEnabled)
          .onChange(async (value) => {
            this.plugin.settings.isSaveToFileEnabled = value;
            await this.plugin.saveSettings();
            this.display();
          })
        );

    new Setting(containerEl)
      .setName("Periodically save your calendar")
      .setDesc("Do you want the plugin to periodically process your tasks? If you choose not to then a calendar will only be built when Obsidian is loaded.")
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(this.plugin.settings.isPeriodicSaveEnabled)
          .onChange(async (value) => {
            this.plugin.settings.isPeriodicSaveEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.configurePeriodicSave();
            this.display();
          })
        );

    if (this.plugin.settings.isPeriodicSaveEnabled) {
      new Setting(containerEl)
        .setName("How often should we parse and save your calendar? (minutes)")
        .setDesc("How often do you want to periodically scan for tasks?")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.periodicSaveInterval.toString())
            .onChange(async (value) => {
              let minutes: number = parseInt(value, 10);
              if (minutes < 1) minutes = 1;
              if (minutes > 1440) minutes = 1440;
              this.plugin.settings.periodicSaveInterval = minutes;
              await this.plugin.saveSettings();
              this.plugin.configurePeriodicSave();
            })
        );
      }

    if (this.plugin.settings.isSaveToGistEnabled) {
      containerEl.createEl('h1', { text: 'Save calendar to GitHub Gist' });

      containerEl.createEl('p', { cls: 'setting-item-description', text: 'Perform the following steps to get your Personal Access Token and Gist ID:' });
      const ol = containerEl.createEl('ol');
      ol.createEl('li', { cls: 'setting-item-description', text: 'Go to https://github.com/settings/tokens/new and create a new personal access token. It only needs Gist scope.' });
      ol.createEl('li', { cls: 'setting-item-description', text: 'Go to https://gist.github.com/ and create a new secret Gist.' });
      containerEl.append(ol);

      new Setting(containerEl)
        .setName("GitHub personal access token")
        .setDesc("Used to privately store your calendar on Github")
        .addText((text: TextComponent) =>
          text
            .setValue(this.plugin.settings.githubPersonalAccessToken)
            .onChange(async (value) => {
              try {
                this.validateGithubPersonalAccessToken(value);
                this.plugin.settings.githubPersonalAccessToken = value;
                await this.plugin.saveSettings();
              } catch(error) {
                // Show the error and set the style
              }
            })
        );

      new Setting(containerEl)
        .setName("GitHub Gist ID")
        .setDesc("This is the unique ID to the Gist that you created in GitHub")
        .addText((text: TextComponent) =>
          text
            // .setPlaceholder("Enter your GitHub Gist ID")
            .setValue(this.plugin.settings.githubGistId)
            .onChange(async (value) => {
              this.plugin.settings.githubGistId = value;
              await this.plugin.saveSettings();
            })
        );

        new Setting(containerEl)
          .setName("GitHub username")
          .setDesc("This is only used to generate the URL to your calendar")
          .addText((text: TextComponent) =>
            text
              .setValue(this.plugin.settings.githubUsername)
              .onChange(async (value) => {
                this.plugin.settings.githubUsername = value;
                await this.plugin.saveSettings();
              })
          );

          new Setting(containerEl)
            .setName("Filename")
            .setDesc("Give your calendar a file name")
            .addText((text: TextComponent) =>
              text
                .setValue(this.plugin.settings.filename)
                .setPlaceholder('obsidian.ics')
                .onChange(async (value) => {
                  this.plugin.settings.filename = value;
                  await this.plugin.saveSettings();
                })
            );

            const url = `https://gist.githubusercontent.com/${this.plugin.settings.githubUsername}/${this.plugin.settings.githubGistId}/raw/${this.plugin.settings.filename}`;

            new Setting(containerEl)
              .setName("Your calendar URL")
              .setDesc(createFragment((fragment) => {
                fragment.createEl('a', { text: url, href: url, cls: 'search-result'});
              }))
              .addButton((button: ButtonComponent) => {
                button
                  .setButtonText('📋 Copy to clipboard')
                  .onClick((event) => {
                    navigator.clipboard.writeText(url);
                    button.setButtonText('✅ Copied!')
                    window.setTimeout(() => {
                      button.setButtonText('📋 Copy to clipboard');
                    }, 500);
                  })
              });
      }


    if (this.plugin.settings.isSaveToFileEnabled) {
      containerEl.createEl('h1', { text: 'Save calendar to disk' });

      if (this.plugin.settings.saveFileName === DEFAULT_SETTINGS.saveFileName) {
        this.plugin.settings.saveFileName = this.app.vault.getName();
        await this.plugin.saveSettings();
      }

      new Setting(containerEl)
        .setName("Path")
        .setDesc("Which directory/folder do you want to save your calendar to? An empty string means to the current vault root path. The path must be inside the vault.")
        .addText((text: TextComponent) =>
          text
            .setValue(this.plugin.settings.savePath)
            .onChange(async (value) => {
              this.plugin.settings.savePath = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Filename")
        .setDesc("What do you want to call the file of your calendar? An empty string means " + this.app.vault.getName())
        .addText((text: TextComponent) =>
          text
            .setPlaceholder(this.app.vault.getName())
            .setValue(this.plugin.settings.saveFileName ?? this.app.vault.getName())
              .onChange(async (value) => {
                this.plugin.settings.saveFileName = value;
                await this.plugin.saveSettings();
              })
        );

        new Setting(containerEl)
          .setName("File extension")
          .setDesc("The file extension must be one of .ical or .ics or .ifb or .icalendar")
          .addDropdown((dropdown: DropdownComponent) =>
            dropdown
              .addOptions({
                '.ics': '.ics',
                '.ical': '.ical',
                '.ifb': '.ifb',
                '.icalendar': '.icalendar',
              })
              .setValue(this.plugin.settings.saveFileExtension)
              .onChange(async (value) => {
                this.plugin.settings.saveFileExtension = value;
                await this.plugin.saveSettings();
              })
          );

          const savePath = `${this.plugin.settings.savePath ?? this.plugin.settings.savePath + path.sep}${this.plugin.settings.saveFileName}${this.plugin.settings.saveFileExtension}`

          new Setting(containerEl)
            .setName("Your calendar path")
            .setDesc(createFragment((fragment) => {
              fragment.createEl('a', { text: savePath, href: `file:///${savePath}`, cls: 'search-result'});
            }))
            .addButton((button: ButtonComponent) => {
              button
                .setButtonText('📋 Copy to clipboard')
                .onClick((event) => {
                  navigator.clipboard.writeText(savePath);
                  button.setButtonText('✅ Copied!')
                  window.setTimeout(() => {
                    button.setButtonText('📋 Copy to clipboard');
                  }, 500);
                })
            });

    new Setting(containerEl)
      .setName("Debug mode")
      .setDesc('Turning this on will write logs to console.')
      .addToggle((toggle: ToggleComponent) =>
        toggle
          .setValue(this.plugin.settings.isDebug)
          .onChange(async (value) => {
            this.plugin.settings.isDebug = value;
            await this.plugin.saveSettings();
            this.display();
          })
        );
    }
  }

  validateGithubPersonalAccessToken(value: string): void {
    const githubClassicPersonalAccessTokenRegex = /^ghp_[a-zA-Z0-9]{255}$/;
    const githubFineGrainedPersonalAccessTokenRegex = /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/;

    if (new RegExp(githubClassicPersonalAccessTokenRegex).test(value) || new RegExp(githubFineGrainedPersonalAccessTokenRegex).test(value)) {
      return;
    }

    throw new Error('GitHub Personal Access Token must start in "ghp_" for classic tokens or "github_pat_" for fine-grained tokens.');
  }
}
