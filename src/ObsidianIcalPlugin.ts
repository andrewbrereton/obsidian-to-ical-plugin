import {
  App,
  Plugin,
  PluginSettingTab,
  Setting
} from "obsidian";
import { Main } from "src/Main";
import { Settings, DEFAULT_SETTINGS } from "src/Model/Settings";

export default class ObsidianIcalPlugin extends Plugin {
  settings: Settings;
  main: Main;

  async onload() {
    await this.loadSettings();

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

    // TODO: Trigger a save every now and then
    // TODO: Make the interval a setting
    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    // this.registerInterval(
    //   window.setInterval(() => {
    //     console.log("setInterval");
    //   }, 5 * 60 * 1000)
    // );

    this.main = new Main(this.app, this.settings);
    await this.main.start();
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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

    containerEl.createEl('p', { text: 'This plugin finds all of the tasks in your vault that contain a date and generates a calendar in iCal format. The calendar is stored in a Gist on GitHub so that it can be added to your iCal calendar of choice. Perhaps in the future this plugin should support additional storage providers (like S3).' });

    containerEl.createEl('p', { text: 'Perform the following steps to get your Personal Access Token and Gist ID:' });
    const ol = containerEl.createEl('ol');
    ol.createEl('li', { text: 'Go to https://github.com/settings/tokens/new and create a new personal access token. It only needs Gist scope.' });
    ol.createEl('li', { text: 'Go to https://gist.github.com/ and create a new secret Gist.' });
    containerEl.append(ol);

    new Setting(containerEl)
      .setName("GitHub personal access token")
      .setDesc("Used to privately store your calendar on Github")
      .addText((text) =>
        text
          // .setPlaceholder("ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
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
      .addText((text) =>
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
        .addText((text) =>
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
          .addText((text) =>
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
            .addButton((button) => {
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

      // containerEl
      //   .createEl('div', { cls: 'setting-item-name', text: 'URL to your calendar'})
      //   .createEl('button', { text: '📋 Copy'});
      // containerEl
      //   .createEl('div', { cls: 'setting-item-description' })
      //   .createEl('a', { text: url, href: url});
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
