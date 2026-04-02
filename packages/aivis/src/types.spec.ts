import { describe, it, expect } from 'vitest';
import type {
  Annotation,
  Session,
  SessionStatus,
  AnnotationIntent,
  AnnotationSeverity,
  AnnotationStatus,
} from './types';

describe('Annotation', () => {
  it('should have required fields', () => {
    const annotation: Annotation = {
      id: 'test-id',
      x: 10,
      y: 20,
      comment: 'test comment',
      element: 'button',
      elementPath: 'div > button',
      timestamp: Date.now(),
    };
    expect(annotation.id).toBe('test-id');
    expect(annotation.element).toBe('button');
    expect(annotation.x).toBe(10);
    expect(annotation.y).toBe(20);
    expect(annotation.comment).toBe('test comment');
  });

  it('should allow optional fields', () => {
    const annotation: Annotation = {
      id: 'test-id',
      x: 10,
      y: 20,
      comment: 'test comment',
      element: 'button',
      elementPath: 'div > button',
      timestamp: Date.now(),
      selectedText: 'selected text',
      boundingBox: { x: 0, y: 0, width: 100, height: 50 },
      nearbyText: 'some nearby text',
      cssClasses: 'btn primary',
      nearbyElements: 'div.container',
      computedStyles: 'color: red',
      fullPath: 'html > body > div > button',
      accessibility: 'role="button"',
      isMultiSelect: false,
      isFixed: false,
      reactComponents: '<App> <Button>',
      sourceFile: 'src/Button.tsx:42',
      drawingIndex: 0,
    };

    expect(annotation.selectedText).toBe('selected text');
    expect(annotation.boundingBox?.width).toBe(100);
    expect(annotation.reactComponents).toBe('<App> <Button>');
  });

  it('should support feedback kind annotations', () => {
    const annotation: Annotation = {
      id: 'feedback-1',
      x: 10,
      y: 20,
      comment: 'feedback',
      element: 'button',
      elementPath: 'div > button',
      timestamp: Date.now(),
      kind: 'feedback',
    };
    expect(annotation.kind).toBe('feedback');
  });

  it('should support placement kind annotations', () => {
    const annotation: Annotation = {
      id: 'placement-1',
      x: 10,
      y: 20,
      comment: 'placement',
      element: 'div',
      elementPath: 'body > div',
      timestamp: Date.now(),
      kind: 'placement',
      placement: {
        componentType: 'Button',
        width: 120,
        height: 40,
        scrollY: 0,
        text: 'Click me',
      },
    };
    expect(annotation.kind).toBe('placement');
    expect(annotation.placement?.componentType).toBe('Button');
  });

  it('should support rearrange kind annotations', () => {
    const annotation: Annotation = {
      id: 'rearrange-1',
      x: 10,
      y: 20,
      comment: 'rearrange',
      element: 'div',
      elementPath: 'body > div',
      timestamp: Date.now(),
      kind: 'rearrange',
      rearrange: {
        selector: '.sidebar',
        label: 'Sidebar',
        tagName: 'div',
        originalRect: { x: 0, y: 0, width: 200, height: 400 },
        currentRect: { x: 100, y: 0, width: 200, height: 400 },
      },
    };
    expect(annotation.kind).toBe('rearrange');
    expect(annotation.rearrange?.selector).toBe('.sidebar');
  });

  it('should support protocol fields', () => {
    const annotation: Annotation = {
      id: 'protocol-1',
      x: 10,
      y: 20,
      comment: 'protocol test',
      element: 'button',
      elementPath: 'div > button',
      timestamp: Date.now(),
      sessionId: 'session-123',
      url: 'https://example.com/page',
      intent: 'fix',
      severity: 'blocking',
      status: 'pending',
      authorId: 'user-456',
    };
    expect(annotation.intent).toBe('fix');
    expect(annotation.severity).toBe('blocking');
    expect(annotation.status).toBe('pending');
  });
});

describe('AnnotationIntent', () => {
  it('should be one of the valid values', () => {
    const intents: AnnotationIntent[] = ['fix', 'change', 'question', 'approve'];
    intents.forEach((intent) => {
      expect(['fix', 'change', 'question', 'approve']).toContain(intent);
    });
  });
});

describe('AnnotationSeverity', () => {
  it('should be one of the valid values', () => {
    const severities: AnnotationSeverity[] = ['blocking', 'important', 'suggestion'];
    severities.forEach((severity) => {
      expect(['blocking', 'important', 'suggestion']).toContain(severity);
    });
  });
});

describe('AnnotationStatus', () => {
  it('should be one of the valid values', () => {
    const statuses: AnnotationStatus[] = ['pending', 'acknowledged', 'resolved', 'dismissed'];
    statuses.forEach((status) => {
      expect(['pending', 'acknowledged', 'resolved', 'dismissed']).toContain(status);
    });
  });
});

describe('Session', () => {
  it('should have required fields', () => {
    const session: Session = {
      id: 'session-1',
      url: 'https://example.com',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    expect(session.id).toBe('session-1');
    expect(session.status).toBe('active');
    expect(session.url).toBe('https://example.com');
  });

  it('should allow optional fields', () => {
    const session: Session = {
      id: 'session-1',
      url: 'https://example.com',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: 'project-123',
      metadata: { key: 'value' },
    };
    expect(session.projectId).toBe('project-123');
    expect(session.metadata?.key).toBe('value');
  });
});

describe('SessionStatus', () => {
  it('should be one of the valid values', () => {
    const statuses: SessionStatus[] = ['active', 'approved', 'closed'];
    statuses.forEach((status) => {
      expect(['active', 'approved', 'closed']).toContain(status);
    });
  });
});
