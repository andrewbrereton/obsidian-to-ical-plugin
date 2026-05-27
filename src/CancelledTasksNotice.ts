// One-time announcement that the ignoreCancelledTasks default flipped to true.
// Existing users upgrading to the release containing PR #180 would otherwise
// see cancelled tasks silently disappear from their calendars; this Notice
// makes the behaviour change visible and tells them how to revert.
//
// The decision logic is split out so it can be unit-tested without
// instantiating Obsidian's Notice class or the SettingsManager singleton.

export interface CancelledTasksNoticeContext {
  // True if the user has already seen the notice in a previous session.
  hasSeen: boolean;
  // Persists hasSeen=true so the notice doesn't fire again.
  markSeen: () => void;
  // Displays the message — usually `new Notice(msg, timeoutMs)` in production.
  showNotice: (message: string) => void;
}

export const CANCELLED_TASKS_NOTICE_MESSAGE =
  'obsidian-to-ical: cancelled tasks (- [-]) are hidden from your calendar by default. ' +
  'You can re-enable them in Settings → "Ignore cancelled tasks?".';

// Show the one-time notice if it hasn't been shown yet. Returns true when the
// notice fired this call, false when it was suppressed. Always marks-seen
// after firing so subsequent calls become no-ops even across sessions.
export function maybeShowCancelledTasksNotice(ctx: CancelledTasksNoticeContext): boolean {
  if (ctx.hasSeen) return false;
  ctx.showNotice(CANCELLED_TASKS_NOTICE_MESSAGE);
  ctx.markSeen();
  return true;
}
