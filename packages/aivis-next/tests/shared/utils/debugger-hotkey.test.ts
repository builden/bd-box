import { expect, test } from 'bun:test';
import { createDebuggerPauseScheduler } from '@/shared/utils/debugger-hotkey';

type ScheduledTask = {
  id: number;
  delay: number;
  callback: () => void;
};

function createTimerHarness() {
  let nextId = 0;
  const tasks: ScheduledTask[] = [];

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const task = { id: ++nextId, delay, callback };
    tasks.push(task);
    return task.id as ReturnType<typeof setTimeout>;
  };

  const clearScheduledTimeout = (handle: ReturnType<typeof setTimeout>) => {
    const index = tasks.findIndex((task) => task.id === handle);
    if (index >= 0) {
      tasks.splice(index, 1);
    }
  };

  const runNext = () => {
    const task = tasks.shift();
    if (!task) {
      throw new Error('No scheduled task to run');
    }
    task.callback();
  };

  return { tasks, scheduleTimeout, clearScheduledTimeout, runNext };
}

test('debugger scheduler shows a countdown and pauses after five seconds', () => {
  const harness = createTimerHarness();
  const messages: string[] = [];
  const scheduler = createDebuggerPauseScheduler({
    setToast: (toast) => {
      if (toast) messages.push(toast.message);
    },
    onPause: () => {
      messages.push('paused');
    },
    scheduleTimeout: harness.scheduleTimeout,
    clearScheduledTimeout: harness.clearScheduledTimeout,
  });

  scheduler.trigger();

  expect(messages[messages.length - 1] ?? '').toContain('5 秒后暂停调试');
  expect(harness.tasks).toHaveLength(1);

  harness.runNext();
  expect(messages[messages.length - 1] ?? '').toContain('4 秒后暂停调试');

  harness.runNext();
  expect(messages[messages.length - 1] ?? '').toContain('3 秒后暂停调试');

  harness.runNext();
  expect(messages[messages.length - 1] ?? '').toContain('2 秒后暂停调试');

  harness.runNext();
  expect(messages[messages.length - 1] ?? '').toContain('1 秒后暂停调试');

  harness.runNext();
  expect(messages[messages.length - 1] ?? '').toBe('paused');
});

test('debugger scheduler resets when retriggered', () => {
  const harness = createTimerHarness();
  const messages: string[] = [];
  const scheduler = createDebuggerPauseScheduler({
    setToast: (toast) => {
      if (toast) messages.push(toast.message);
    },
    onPause: () => {
      messages.push('paused');
    },
    scheduleTimeout: harness.scheduleTimeout,
    clearScheduledTimeout: harness.clearScheduledTimeout,
  });

  scheduler.trigger();
  expect(harness.tasks).toHaveLength(1);
  scheduler.trigger();
  expect(harness.tasks).toHaveLength(1);
  expect(messages[messages.length - 1] ?? '').toContain('5 秒后暂停调试');
});
