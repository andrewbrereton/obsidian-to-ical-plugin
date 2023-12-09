import { ItemView, WorkspaceLeaf } from "obsidian";
import { NormalisedTask } from "./Model/NormalisedTask";
import { EVENT_ICAL_NORMALISED_TASKS_UPDATED, on } from "./Events";

export const VIEW_TYPE_ICAL = "ical-sidebar-view";

export class SidebarView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    on(EVENT_ICAL_NORMALISED_TASKS_UPDATED, this.onNormalisedTasksUpdated.bind(this));
  }

  getViewType() {
    return VIEW_TYPE_ICAL;
  }

  getDisplayText() {
    return "iCal";
  }

  onNormalisedTasksUpdated(normalisedTasks: any) {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h2", { text: "Your Agenda" });

    normalisedTasks.forEach((normalisedTask: NormalisedTask) => {
      const p = container.createEl('p');
      p.createEl('a', {
        text: `${normalisedTask.date} | ${normalisedTask.summary}`,
        href: normalisedTask.link
      });
      container.append(p);
    });
  }

  async onOpen(): Promise<void> {
    // Rendering happens during onNormalisedTasksUpdated
  }

  async onClose() {
    // Nothing to clean up.
  }
}