import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Annotation } from '../types';
import {
  getStorageKey,
  loadAnnotations,
  saveAnnotations,
  clearAnnotations,
  loadAllAnnotations,
  saveAnnotationsWithSyncMarker,
  getUnsyncedAnnotations,
  clearSyncMarkers,
  loadDesignPlacements,
  saveDesignPlacements,
  clearDesignPlacements,
  loadRearrangeState,
  saveRearrangeState,
  clearRearrangeState,
  loadWireframeState,
  saveWireframeState,
  clearWireframeState,
  getSessionStorageKey,
  loadSessionId,
  saveSessionId,
  clearSessionId,
  loadToolbarHidden,
  saveToolbarHidden,
} from './storage';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Setup global mocks
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

describe('getStorageKey', () => {
  it('should return key with prefix', () => {
    const key = getStorageKey('/test-page');
    expect(key).toBe('feedback-annotations-/test-page');
  });

  it('should handle different pathnames', () => {
    expect(getStorageKey('/page1')).toBe('feedback-annotations-/page1');
    expect(getStorageKey('/deep/nested/page')).toBe('feedback-annotations-/deep/nested/page');
  });
});

describe('loadAnnotations', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return empty array when no data', () => {
    const result = loadAnnotations('/nonexistent');
    expect(result).toEqual([]);
  });

  it('should load and parse stored annotations', () => {
    const annotations: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'test',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
      },
    ];
    localStorageMock.setItem('feedback-annotations-/test', JSON.stringify(annotations));

    const result = loadAnnotations('/test');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter out expired annotations', () => {
    const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
    const annotations = [
      {
        id: 'old',
        x: 10,
        y: 20,
        comment: 'old',
        element: 'button',
        elementPath: 'div > button',
        timestamp: oldTimestamp,
      },
    ];
    localStorageMock.setItem('feedback-annotations-/test', JSON.stringify(annotations));

    const result = loadAnnotations('/test');
    expect(result).toHaveLength(0);
  });

  it('should handle invalid JSON gracefully', () => {
    localStorageMock.setItem('feedback-annotations-/test', 'invalid json');

    const result = loadAnnotations('/test');
    expect(result).toEqual([]);
  });
});

describe('saveAnnotations', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save annotations to localStorage', () => {
    const annotations: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'test',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
      },
    ];

    saveAnnotations('/test', annotations);

    const stored = localStorageMock.getItem('feedback-annotations-/test');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('1');
  });

  it('should overwrite existing annotations', () => {
    const annotations1: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'first',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
      },
    ];
    const annotations2: Annotation[] = [
      {
        id: '2',
        x: 20,
        y: 30,
        comment: 'second',
        element: 'input',
        elementPath: 'div > input',
        timestamp: Date.now(),
      },
    ];

    saveAnnotations('/test', annotations1);
    saveAnnotations('/test', annotations2);

    const stored = localStorageMock.getItem('feedback-annotations-/test');
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('2');
  });
});

describe('clearAnnotations', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should remove annotations from localStorage', () => {
    const annotations: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'test',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
      },
    ];
    saveAnnotations('/test', annotations);
    expect(localStorageMock.getItem('feedback-annotations-/test')).toBeTruthy();

    clearAnnotations('/test');
    expect(localStorageMock.getItem('feedback-annotations-/test')).toBeNull();
  });
});

describe('loadAllAnnotations', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return empty map when no data', () => {
    const result = loadAllAnnotations();
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should load annotations from multiple pages', () => {
    const annotations1: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'test1',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
      },
    ];
    const annotations2: Annotation[] = [
      {
        id: '2',
        x: 20,
        y: 30,
        comment: 'test2',
        element: 'input',
        elementPath: 'div > input',
        timestamp: Date.now(),
      },
    ];

    saveAnnotations('/page1', annotations1);
    saveAnnotations('/page2', annotations2);

    const result = loadAllAnnotations();
    expect(result.size).toBe(2);
    expect(result.get('/page1')).toHaveLength(1);
    expect(result.get('/page2')).toHaveLength(1);
  });

  it('should filter out expired annotations when loading all', () => {
    const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const annotations = [
      {
        id: 'old',
        x: 10,
        y: 20,
        comment: 'old',
        element: 'button',
        elementPath: 'div > button',
        timestamp: oldTimestamp,
      },
    ];
    saveAnnotations('/old-page', annotations);

    const result = loadAllAnnotations();
    expect(result.size).toBe(0);
  });
});

describe('saveAnnotationsWithSyncMarker', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should add sync marker to annotations', () => {
    const annotations: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'test',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
      },
    ];

    saveAnnotationsWithSyncMarker('/test', annotations, 'session-123');

    const stored = localStorageMock.getItem('feedback-annotations-/test');
    const parsed = JSON.parse(stored!);
    expect(parsed[0]._syncedTo).toBe('session-123');
  });
});

describe('getUnsyncedAnnotations', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return annotations without sync marker', () => {
    const annotations: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'unsynced',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
      },
    ];
    saveAnnotations('/test', annotations);

    const result = getUnsyncedAnnotations('/test');
    expect(result).toHaveLength(1);
  });

  it('should filter out annotations synced to different session', () => {
    const annotations: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'synced elsewhere',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
        _syncedTo: 'other-session',
      },
    ];
    saveAnnotations('/test', annotations);

    const result = getUnsyncedAnnotations('/test', 'my-session');
    expect(result).toHaveLength(1);
  });
});

describe('clearSyncMarkers', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should remove sync markers from annotations', () => {
    const annotations: Annotation[] = [
      {
        id: '1',
        x: 10,
        y: 20,
        comment: 'test',
        element: 'button',
        elementPath: 'div > button',
        timestamp: Date.now(),
        _syncedTo: 'session-123',
      },
    ];
    saveAnnotations('/test', annotations);

    clearSyncMarkers('/test');

    const stored = localStorageMock.getItem('feedback-annotations-/test');
    const parsed = JSON.parse(stored!);
    expect(parsed[0]._syncedTo).toBeUndefined();
  });
});

describe('Design Placements Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save and load design placements', () => {
    const placements = [{ componentType: 'Button', x: 100, y: 200 }];

    saveDesignPlacements('/test', placements);
    const result = loadDesignPlacements('/test');

    expect(result).toEqual(placements);
  });

  it('should return empty array when no data', () => {
    const result = loadDesignPlacements('/nonexistent');
    expect(result).toEqual([]);
  });

  it('should clear design placements', () => {
    saveDesignPlacements('/test', [{ componentType: 'Button', x: 100, y: 200 }]);
    clearDesignPlacements('/test');

    const result = loadDesignPlacements('/test');
    expect(result).toEqual([]);
  });
});

describe('Rearrange State Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save and load rearrange state', () => {
    const state = { selector: '.sidebar', x: 100, y: 200 };

    saveRearrangeState('/test', state);
    const result = loadRearrangeState('/test');

    expect(result).toEqual(state);
  });

  it('should return null when no data', () => {
    const result = loadRearrangeState('/nonexistent');
    expect(result).toBeNull();
  });

  it('should clear rearrange state', () => {
    saveRearrangeState('/test', { selector: '.sidebar' });
    clearRearrangeState('/test');

    const result = loadRearrangeState('/test');
    expect(result).toBeNull();
  });
});

describe('Wireframe State Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save and load wireframe state', () => {
    const state = {
      rearrange: { selector: '.sidebar' },
      placements: [{ componentType: 'Button' }],
      purpose: 'redesign',
    };

    saveWireframeState('/test', state);
    const result = loadWireframeState('/test');

    expect(result).toEqual(state);
  });

  it('should return null when no data', () => {
    const result = loadWireframeState('/nonexistent');
    expect(result).toBeNull();
  });

  it('should clear wireframe state', () => {
    const state = {
      rearrange: { selector: '.sidebar' },
      placements: [],
      purpose: 'test',
    };
    saveWireframeState('/test', state);
    clearWireframeState('/test');

    const result = loadWireframeState('/test');
    expect(result).toBeNull();
  });
});

describe('Session Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save and load session ID', () => {
    saveSessionId('/test', 'session-123');
    const result = loadSessionId('/test');

    expect(result).toBe('session-123');
  });

  it('should return null when no session ID', () => {
    const result = loadSessionId('/nonexistent');
    expect(result).toBeNull();
  });

  it('should clear session ID', () => {
    saveSessionId('/test', 'session-123');
    clearSessionId('/test');

    const result = loadSessionId('/test');
    expect(result).toBeNull();
  });

  it('should generate correct session storage key', () => {
    const key = getSessionStorageKey('/test-page');
    expect(key).toBe('agentation-session-/test-page');
  });
});

describe('Toolbar Visibility Storage', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
  });

  it('should save toolbar hidden state', () => {
    saveToolbarHidden(true);
    const result = loadToolbarHidden();
    expect(result).toBe(true);
  });

  it('should save toolbar visible state', () => {
    saveToolbarHidden(false);
    const result = loadToolbarHidden();
    expect(result).toBe(false);
  });

  it('should return false when not set', () => {
    const result = loadToolbarHidden();
    expect(result).toBe(false);
  });
});
