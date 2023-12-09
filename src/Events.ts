import { EventRef, Events as ObsidianEvents, moment } from "obsidian";

// Logger class in instantiated using a singleton pattern so isDebug only needs to be set once.

export const EVENT_ICAL_NORMALISED_TASKS_UPDATED = 'ical.normalisedTasks.updated';

class Events {
  private static instance: ObsidianEvents;

  private constructor() {
  }

  public static getInstance(): ObsidianEvents {
    if (!Events.instance) {
      Events.instance = new ObsidianEvents();
    }
    return Events.instance;
  }

  public on(name: string, callback: (data: any) => void): EventRef {
    return Events.instance.on(name, callback);
  }

  public trigger(name: string, data: any): any {
    return Events.instance.trigger(name, data);
  }
}

export function events() {
  return Events.getInstance();
}

export function on(name: string, callback: (data: any) => void): EventRef {
  return Events.getInstance().on(name, callback);
}

export function trigger(name: string, data: any): any {
  return Events.getInstance().trigger(name, data);
}