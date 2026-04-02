import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Annotation } from '../types';
import { generateOutput, OUTPUT_DETAIL_OPTIONS, OUTPUT_TO_REACT_MODE } from './generate-output';

// Mock window properties that generateOutput uses
const mockWindow = {
  innerWidth: 1920,
  innerHeight: 1080,
  location: { href: 'https://example.com/test' },
  devicePixelRatio: 2,
};

describe('generateOutput', () => {
  beforeEach(() => {
    // Setup window mock
    Object.defineProperty(globalThis, 'window', {
      value: mockWindow,
      writable: true,
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'test-agent' },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up if needed
  });

  it('should return empty string for empty annotations', () => {
    const result = generateOutput([], '/test', 'standard');
    expect(result).toBe('');
  });

  it('should generate header with pathname', () => {
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

    const result = generateOutput(annotations, '/test-page', 'standard');
    expect(result).toContain('## 页面反馈: /test-page');
  });

  it('should include viewport in non-compact modes', () => {
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

    const result = generateOutput(annotations, '/test', 'standard');
    expect(result).toContain('**视口:** 1920×1080');
  });

  describe('compact detail level', () => {
    it('should generate compact format', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'Fix this button',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
        },
      ];

      const result = generateOutput(annotations, '/test', 'compact');
      expect(result).toContain('1. **button**: Fix this button');
      expect(result).not.toContain('**视口:**');
    });

    it('should include selected text in compact mode', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'review',
          element: 'p',
          elementPath: 'div > p',
          timestamp: Date.now(),
          selectedText: 'This is some selected text that definitely needs to be reviewed carefully',
        },
      ];

      const result = generateOutput(annotations, '/test', 'compact');
      // Long text (>30 chars) should be truncated
      expect(result).toContain('(re: "');
      expect(result).toContain('...")');
    });

    it('should truncate long selected text in compact mode', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'review',
          element: 'p',
          elementPath: 'div > p',
          timestamp: Date.now(),
          selectedText: 'A'.repeat(50),
        },
      ];

      const result = generateOutput(annotations, '/test', 'compact');
      expect(result).toContain('...")');
    });
  });

  describe('standard detail level', () => {
    it('should include element path', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > form > button.submit-btn',
          timestamp: Date.now(),
        },
      ];

      const result = generateOutput(annotations, '/test', 'standard');
      expect(result).toContain('**位置:** div > form > button.submit-btn');
      expect(result).toContain('### 1. button');
    });

    it('should include source file when available', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          sourceFile: 'src/components/Button.tsx:42',
        },
      ];

      const result = generateOutput(annotations, '/test', 'standard');
      expect(result).toContain('**源码:** src/components/Button.tsx:42');
    });

    it('should include react components when available', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          reactComponents: '<App> <Dashboard> <Button>',
        },
      ];

      const result = generateOutput(annotations, '/test', 'standard');
      expect(result).toContain('**React:** <App> <Dashboard> <Button>');
    });

    it('should include selected text', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'p',
          elementPath: 'div > p',
          timestamp: Date.now(),
          selectedText: 'Important text',
        },
      ];

      const result = generateOutput(annotations, '/test', 'standard');
      expect(result).toContain('**选中文本:** "Important text"');
    });
  });

  describe('detailed detail level', () => {
    it('should include CSS classes', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          cssClasses: 'btn primary large',
        },
      ];

      const result = generateOutput(annotations, '/test', 'detailed');
      expect(result).toContain('**类:** btn primary large');
    });

    it('should include bounding box', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          boundingBox: { x: 100, y: 200, width: 150, height: 50 },
        },
      ];

      const result = generateOutput(annotations, '/test', 'detailed');
      expect(result).toContain('**位置:** 100px, 200px (150×50px)');
    });

    it('should include nearby text context', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'span',
          elementPath: 'div > span',
          timestamp: Date.now(),
          nearbyText: 'Some context text',
        },
      ];

      const result = generateOutput(annotations, '/test', 'detailed');
      expect(result).toContain('**上下文:** Some context text');
    });

    it('should not include nearby text when selected text exists', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'span',
          elementPath: 'div > span',
          timestamp: Date.now(),
          selectedText: 'Selected text',
          nearbyText: 'Nearby text that should not appear',
        },
      ];

      const result = generateOutput(annotations, '/test', 'detailed');
      expect(result).not.toContain('Nearby text');
    });
  });

  describe('forensic detail level', () => {
    it('should include environment information', () => {
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

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('**环境:**');
      expect(result).toContain('视口: 1920×1080');
      expect(result).toContain('URL: https://example.com/test');
      expect(result).toContain('设备像素比: 2');
    });

    it('should include full DOM path', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          fullPath: 'html > body > div#root > div.container > button#submit',
        },
      ];

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('**完整 DOM 路径:**');
    });

    it('should include CSS classes in forensic mode', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          cssClasses: 'btn primary',
        },
      ];

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('**CSS 类:** btn primary');
    });

    it('should include accessibility info when available', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          accessibility: 'role="button", aria-label="Submit form"',
        },
      ];

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('**无障碍:**');
    });

    it('should include nearby elements when available', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          nearbyElements: 'div.sidebar, button.cancel, span.label',
        },
      ];

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('**附近元素:**');
    });

    it('should include computed styles when available', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
          computedStyles: 'color: red; background-color: blue;',
        },
      ];

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('**计算样式:**');
    });

    it('should include annotation position as percentage', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 25.5,
          y: 100,
          comment: 'test',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
        },
      ];

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('左侧 25.5%');
      expect(result).toContain('顶部 100px');
    });
  });

  describe('OUTPUT_DETAIL_OPTIONS', () => {
    it('should have all expected detail levels', () => {
      expect(OUTPUT_DETAIL_OPTIONS).toHaveLength(4);
      expect(OUTPUT_DETAIL_OPTIONS.map((o) => o.value)).toEqual(['compact', 'standard', 'detailed', 'forensic']);
    });

    it('should have labels for each level', () => {
      OUTPUT_DETAIL_OPTIONS.forEach((option) => {
        expect(option.label).toBeTruthy();
        expect(typeof option.label).toBe('string');
      });
    });
  });

  describe('OUTPUT_TO_REACT_MODE', () => {
    it('should map compact to off', () => {
      expect(OUTPUT_TO_REACT_MODE['compact']).toBe('off');
    });

    it('should map standard to filtered', () => {
      expect(OUTPUT_TO_REACT_MODE['standard']).toBe('filtered');
    });

    it('should map detailed to smart', () => {
      expect(OUTPUT_TO_REACT_MODE['detailed']).toBe('smart');
    });

    it('should map forensic to all', () => {
      expect(OUTPUT_TO_REACT_MODE['forensic']).toBe('all');
    });
  });

  describe('multi-select annotations', () => {
    it('should add forensic note for multi-select full path', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'test',
          element: 'div',
          elementPath: 'div',
          timestamp: Date.now(),
          isMultiSelect: true,
          fullPath: 'html > body > div',
        },
      ];

      const result = generateOutput(annotations, '/test', 'forensic');
      expect(result).toContain('*显示选择中第一个元素的取证数据*');
    });
  });

  describe('multiple annotations', () => {
    it('should number annotations sequentially', () => {
      const annotations: Annotation[] = [
        {
          id: '1',
          x: 10,
          y: 20,
          comment: 'first',
          element: 'button',
          elementPath: 'div > button',
          timestamp: Date.now(),
        },
        {
          id: '2',
          x: 20,
          y: 30,
          comment: 'second',
          element: 'input',
          elementPath: 'div > input',
          timestamp: Date.now(),
        },
        {
          id: '3',
          x: 30,
          y: 40,
          comment: 'third',
          element: 'div',
          elementPath: 'div',
          timestamp: Date.now(),
        },
      ];

      const result = generateOutput(annotations, '/test', 'standard');
      expect(result).toContain('### 1. button');
      expect(result).toContain('### 2. input');
      expect(result).toContain('### 3. div');
    });
  });
});
