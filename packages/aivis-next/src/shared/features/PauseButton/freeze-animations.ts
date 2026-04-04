// =============================================================================
// Freeze Animations
// =============================================================================
//
// Monkey-patches setTimeout, setInterval, and requestAnimationFrame so that
// callbacks are silently skipped while frozen. Also injects CSS to pause
// CSS animations/transitions, pauses WAAPI animations, and pauses videos.
//
// Toolbar/popup code must import `originalSetTimeout` etc. to bypass the patch.
//
// Patches are installed as a side effect of importing this module.
// =============================================================================

// Exclude selectors - toolbar elements should never be frozen
const EXCLUDE_ATTRS = ['data-feedback-toolbar', 'data-annotation-popup', 'data-annotation-marker'];
const NOT_SELECTORS = EXCLUDE_ATTRS.flatMap((a) => [`:not([${a}])`, `:not([${a}] *)`]).join('');

const STYLE_ID = 'aivis-freeze-styles';
const STATE_KEY = '__aivis_freeze';

// ---------------------------------------------------------------------------
// Shared mutable state on window (survives HMR module re-execution)
// ---------------------------------------------------------------------------
interface FreezeState {
  frozen: boolean;
  installed: boolean;
  origSetTimeout: typeof setTimeout | null;
  origSetInterval: typeof setInterval | null;
  origRAF: typeof requestAnimationFrame | null;
  pausedAnimations: Animation[];
  frozenTimeoutQueue: Array<() => void>;
  frozenRAFQueue: FrameRequestCallback[];
}

function getState(): FreezeState {
  if (typeof window === 'undefined') {
    // SSR stub
    return {
      frozen: false,
      installed: true,
      origSetTimeout: setTimeout,
      origSetInterval: setInterval,
      origRAF: (_cb: FrameRequestCallback) => 0 as unknown as number,
      pausedAnimations: [],
      frozenTimeoutQueue: [],
      frozenRAFQueue: [],
    };
  }
  const w = window as unknown as Record<string, FreezeState>;
  if (!w[STATE_KEY]) {
    w[STATE_KEY] = {
      frozen: false,
      installed: false,
      origSetTimeout: null,
      origSetInterval: null,
      origRAF: null,
      pausedAnimations: [],
      frozenTimeoutQueue: [],
      frozenRAFQueue: [],
    };
  }
  return w[STATE_KEY];
}

const _s = getState();

// ---------------------------------------------------------------------------
// Install patches (once - survives HMR because `installed` lives on window)
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined' && !_s.installed) {
  _s.origSetTimeout = window.setTimeout.bind(window);
  _s.origSetInterval = window.setInterval.bind(window);
  _s.origRAF = window.requestAnimationFrame.bind(window);

  // Patch setTimeout - queue callback when frozen (replayed on unfreeze)
  (window.setTimeout as unknown as (...args: unknown[]) => number) = ((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ): number => {
    if (typeof handler === 'string') {
      return _s.origSetTimeout!(handler, timeout) as unknown as number;
    }
    return _s.origSetTimeout!(
      (...a: unknown[]) => {
        if (_s.frozen) {
          _s.frozenTimeoutQueue.push(() => (handler as (...args: unknown[]) => void)(...a));
        } else {
          (handler as (...args: unknown[]) => void)(...a);
        }
      },
      timeout,
      ...args
    ) as unknown as number;
  }) as unknown as (...args: unknown[]) => number;

  // Patch setInterval - skip callback when frozen
  (window.setInterval as unknown as (...args: unknown[]) => number) = ((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ): number => {
    if (typeof handler === 'string') {
      return _s.origSetInterval!(handler, timeout) as unknown as number;
    }
    return _s.origSetInterval!(
      (...a: unknown[]) => {
        if (!_s.frozen) (handler as (...args: unknown[]) => void)(...a);
      },
      timeout,
      ...args
    ) as unknown as number;
  }) as unknown as (...args: unknown[]) => number;

  // Patch requestAnimationFrame - queue callback when frozen
  (window as Window & typeof globalThis).requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return _s.origRAF!((timestamp: number) => {
      if (_s.frozen) {
        _s.frozenRAFQueue.push(callback);
      } else {
        callback(timestamp);
      }
    });
  };

  _s.installed = true;
}

// ---------------------------------------------------------------------------
// Exports - original (unpatched) timing functions for toolbar/popup use
// ---------------------------------------------------------------------------
export const originalSetTimeout: typeof setTimeout = _s.origSetTimeout!;
export const originalSetInterval: typeof setInterval = _s.origSetInterval!;
export const originalRequestAnimationFrame: typeof requestAnimationFrame = _s.origRAF!;

// ---------------------------------------------------------------------------
// Freeze / Unfreeze
// ---------------------------------------------------------------------------

function isToolbarElement(el: Element | null): boolean {
  if (!el) return false;
  return EXCLUDE_ATTRS.some((attr) => !!el.closest?.(`[${attr}]`));
}

export function freeze(): void {
  if (typeof document === 'undefined') return;
  if (_s.frozen) return;
  _s.frozen = true;
  _s.frozenTimeoutQueue = [];
  _s.frozenRAFQueue = [];

  // CSS injection - pause CSS animations and kill transitions
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
  }
  style.textContent = `
    *${NOT_SELECTORS},
    *${NOT_SELECTORS}::before,
    *${NOT_SELECTORS}::after {
      animation-play-state: paused !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(style);

  // WAAPI - pause only RUNNING non-toolbar animations
  _s.pausedAnimations = [];
  try {
    document.getAnimations().forEach((anim) => {
      if (anim.playState !== 'running') return;
      const target = (anim.effect as KeyframeEffect)?.target as Element | null;
      if (!isToolbarElement(target)) {
        anim.pause();
        _s.pausedAnimations.push(anim);
      }
    });
  } catch {
    // getAnimations may not be available in all environments
  }

  // Pause videos
  document.querySelectorAll('video').forEach((video) => {
    if (!video.paused) {
      video.dataset.wasPaused = 'false';
      video.pause();
    }
  });
}

export function unfreeze(): void {
  if (typeof document === 'undefined') return;
  if (!_s.frozen) return;
  _s.frozen = false;

  // Replay queued setTimeout callbacks asynchronously
  const timeoutQueue = _s.frozenTimeoutQueue;
  _s.frozenTimeoutQueue = [];
  for (const cb of timeoutQueue) {
    _s.origSetTimeout!(() => {
      if (_s.frozen) {
        _s.frozenTimeoutQueue.push(cb);
        return;
      }
      try {
        cb();
      } catch (e) {
        console.warn('[aivis] Error replaying queued timeout:', e);
      }
    }, 0);
  }

  // Schedule queued rAF callbacks for the next frame
  const rafQueue = _s.frozenRAFQueue;
  _s.frozenRAFQueue = [];
  for (const cb of rafQueue) {
    _s.origRAF!((ts: number) => {
      if (_s.frozen) {
        _s.frozenRAFQueue.push(cb);
        return;
      }
      cb(ts);
    });
  }

  // WAAPI - resume the exact animations we paused BEFORE removing CSS
  for (const anim of _s.pausedAnimations) {
    try {
      anim.play();
    } catch (e) {
      console.warn('[aivis] Error resuming animation:', e);
    }
  }
  _s.pausedAnimations = [];

  // Remove CSS injection
  document.getElementById(STYLE_ID)?.remove();

  // Resume videos
  document.querySelectorAll('video').forEach((video) => {
    if (video.dataset.wasPaused === 'false') {
      video.play().catch(() => {});
      delete video.dataset.wasPaused;
    }
  });
}
