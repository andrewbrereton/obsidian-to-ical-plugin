import { moment } from 'obsidian';

// Logger class in instantiated using a singleton pattern so isDebug only needs to be set once.

class Logger {
  private static instance: Logger;
  private isDebug: boolean;

  private constructor(isDebug: boolean) {
    this.isDebug = isDebug;
  }

  public static getInstance(isDebug?: boolean): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(isDebug ?? false);
    } else if (isDebug !== undefined) {
      Logger.instance.isDebug = isDebug;
    }
    return Logger.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public log(message: string, object?: any) {
    if (this.isDebug) {
      console.log('[' + moment().format('YYYY-MM-DD-HH:mm:ss.SSS') + '][info][ical] ' + message);
      if (object) {
        console.log(object);
      }
    }
  }
}

export function logger(isDebug?: boolean) {
  return Logger.getInstance(isDebug);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(message: string, object?: any) {
  return Logger.getInstance().log(message, object);
}
