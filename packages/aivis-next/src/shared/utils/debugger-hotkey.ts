import type { ToastData } from '@/shared/components/store';

type TimeoutHandle = ReturnType<typeof setTimeout>;

export interface DebuggerPauseSchedulerOptions {
  setToast: (toast: ToastData | null) => void;
  onPause: () => void;
  durationMs?: number;
  stepMs?: number;
  scheduleTimeout?: typeof setTimeout;
  clearScheduledTimeout?: typeof clearTimeout;
}

export interface DebuggerPauseScheduler {
  trigger: () => void;
  cancel: () => void;
}

const DEFAULT_DURATION_MS = 5000;
const DEFAULT_STEP_MS = 1000;
const HOTKEY_LABEL = 'Cmd+Shift+9';

let activeScheduler: DebuggerPauseScheduler | null = null;

export function createDebuggerPauseScheduler({
  setToast,
  onPause,
  durationMs = DEFAULT_DURATION_MS,
  stepMs = DEFAULT_STEP_MS,
  scheduleTimeout = setTimeout,
  clearScheduledTimeout = clearTimeout,
}: DebuggerPauseSchedulerOptions): DebuggerPauseScheduler {
  let countdownTimer: TimeoutHandle | null = null;
  let remainingMs = durationMs;

  const clearTimer = () => {
    if (countdownTimer) {
      clearScheduledTimeout(countdownTimer);
      countdownTimer = null;
    }
  };

  const renderCountdown = (secondsLeft: number) => {
    setToast({
      message: `${HOTKEY_LABEL} 已触发，${secondsLeft} 秒后暂停调试`,
      duration: Math.max(stepMs + 300, 1200),
    });
  };

  const pauseDebugger = () => {
    setToast({
      message: `${HOTKEY_LABEL} 正在暂停调试`,
      duration: 1500,
    });
    onPause();
  };

  const tick = () => {
    remainingMs -= stepMs;

    if (remainingMs <= 0) {
      clearTimer();
      pauseDebugger();
      return;
    }

    renderCountdown(Math.ceil(remainingMs / 1000));
    countdownTimer = scheduleTimeout(tick, stepMs);
  };

  const trigger = () => {
    clearTimer();
    remainingMs = durationMs;
    renderCountdown(Math.ceil(remainingMs / 1000));
    countdownTimer = scheduleTimeout(tick, stepMs);
  };

  return {
    trigger,
    cancel: clearTimer,
  };
}

export function registerDebuggerPauseScheduler(scheduler: DebuggerPauseScheduler | null) {
  activeScheduler = scheduler;
}

export function triggerDebuggerPauseScheduler() {
  activeScheduler?.trigger();
}

export function cancelDebuggerPauseScheduler() {
  activeScheduler?.cancel();
  activeScheduler = null;
}
