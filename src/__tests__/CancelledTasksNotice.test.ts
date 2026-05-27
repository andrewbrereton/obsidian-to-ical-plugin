jest.mock('obsidian', () => ({ Plugin: class {} }));

import {
  CANCELLED_TASKS_NOTICE_MESSAGE,
  maybeShowCancelledTasksNotice,
  CancelledTasksNoticeContext,
} from '../CancelledTasksNotice';

function makeCtx(initialHasSeen: boolean): CancelledTasksNoticeContext & {
  shown: string[];
  hasSeen: boolean;
} {
  const shown: string[] = [];
  let seen = initialHasSeen;
  return {
    get hasSeen() {
      return seen;
    },
    set hasSeen(v: boolean) {
      seen = v;
    },
    markSeen() {
      seen = true;
    },
    showNotice(msg: string) {
      shown.push(msg);
    },
    shown,
  };
}

describe('maybeShowCancelledTasksNotice', () => {
  it('shows the notice and marks seen when hasSeen is false', () => {
    const ctx = makeCtx(false);
    const fired = maybeShowCancelledTasksNotice(ctx);

    expect(fired).toBe(true);
    expect(ctx.shown).toEqual([CANCELLED_TASKS_NOTICE_MESSAGE]);
    expect(ctx.hasSeen).toBe(true);
  });

  it('does not show the notice when hasSeen is already true', () => {
    const ctx = makeCtx(true);
    const fired = maybeShowCancelledTasksNotice(ctx);

    expect(fired).toBe(false);
    expect(ctx.shown).toEqual([]);
    expect(ctx.hasSeen).toBe(true);
  });

  it('is idempotent — second call after first does not show again', () => {
    const ctx = makeCtx(false);
    maybeShowCancelledTasksNotice(ctx);
    const secondFired = maybeShowCancelledTasksNotice(ctx);

    expect(secondFired).toBe(false);
    expect(ctx.shown).toEqual([CANCELLED_TASKS_NOTICE_MESSAGE]);
  });

  it('the message mentions the new default behaviour and where to change it', () => {
    expect(CANCELLED_TASKS_NOTICE_MESSAGE).toContain('cancelled tasks');
    expect(CANCELLED_TASKS_NOTICE_MESSAGE).toContain('hidden');
    expect(CANCELLED_TASKS_NOTICE_MESSAGE).toContain('Settings');
    expect(CANCELLED_TASKS_NOTICE_MESSAGE).toContain('Ignore cancelled tasks');
  });

  it('does not use change-announcement wording so it reads cleanly for fresh installs', () => {
    // 'now' implies a 'before' that brand-new users have no context for.
    expect(CANCELLED_TASKS_NOTICE_MESSAGE).not.toMatch(/\bnow\b/i);
  });
});
