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

  // console.debug (rather than console.log) so the output lands in the
  // browser console's Verbose level, which is hidden by default. Obsidian's
  // plugin guidelines disallow console.log; debug/warn/error are permitted.
  public log(message: string, object?: unknown) {
    if (this.isDebug) {
      console.debug('[' + moment().format('YYYY-MM-DD-HH:mm:ss.SSS') + '][info][ical] ' + message);
      if (object) {
        console.debug(object);
      }
    }
  }
}

export function logger(isDebug?: boolean) {
  return Logger.getInstance(isDebug);
}

export function log(message: string, object?: unknown) {
  return Logger.getInstance().log(message, object);
}
