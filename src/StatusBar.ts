import { moment } from 'obsidian';

type StageError = { stage: string; message: string };
type State = 'idle' | 'scanning' | 'building' | 'saving' | 'synced' | 'error';

export class StatusBar {
  private el: HTMLElement | null;
  private lastSyncAt: string | null = null;
  private lastTaskCount: number | null = null;
  private errors: StageError[] = [];

  constructor(el: HTMLElement | null) {
    this.el = el;
    this.render('idle');
  }

  scanning(): void {
    this.errors = [];
    this.render('scanning');
  }

  building(taskCount: number): void {
    this.lastTaskCount = taskCount;
    this.render('building');
  }

  saving(destination: string): void {
    this.render('saving', destination);
  }

  saveError(destination: string, error: unknown): void {
    this.errors.push({ stage: destination, message: messageOf(error) });
  }

  synced(): void {
    this.lastSyncAt = moment().format('HH:mm:ss');
    this.render('synced');
  }

  scanError(error: unknown): void {
    this.errors = [{ stage: 'Scan', message: messageOf(error) }];
    this.render('error');
  }

  private render(state: State, destination?: string): void {
    if (!this.el) return;

    let text: string;
    switch (state) {
      case 'idle':
        text = 'iCal: idle';
        break;
      case 'scanning':
        text = 'iCal: scanning…';
        break;
      case 'building':
        text = 'iCal: building calendar…';
        break;
      case 'saving':
        text = `iCal: saving (${destination})…`;
        break;
      case 'synced':
        text = this.errors.length
          ? `iCal: synced ${this.lastSyncAt} (${this.errors.length} error${this.errors.length === 1 ? '' : 's'})`
          : `iCal: synced ${this.lastSyncAt}`;
        break;
      case 'error':
        text = 'iCal: sync failed';
        break;
    }
    this.el.setText(text);

    const tooltipParts: string[] = [];
    if (this.lastSyncAt) tooltipParts.push(`Last sync: ${this.lastSyncAt}`);
    if (this.lastTaskCount !== null) tooltipParts.push(`Tasks found: ${this.lastTaskCount}`);
    for (const e of this.errors) tooltipParts.push(`Error (${e.stage}): ${e.message}`);
    this.el.setAttr('aria-label', tooltipParts.join('\n') || 'Obsidian to iCal');
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
