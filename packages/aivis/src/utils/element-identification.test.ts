import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getElementPath,
  getNearbyText,
  identifyElement,
  identifyAnimationElement,
  closestCrossingShadow,
  isInShadowDOM,
  getShadowHost,
  getNearbyElements,
  getElementClasses,
} from './element-identification';

describe('getElementPath', () => {
  let container: HTMLDivElement;
  let button: HTMLButtonElement;
  let span: HTMLSpanElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    container.className = 'test-container';

    button = document.createElement('button');
    button.id = 'test-button';
    button.className = 'btn primary';
    button.textContent = 'Click me';

    span = document.createElement('span');
    span.className = 'btn-text';
    span.textContent = 'Submit';

    button.appendChild(span);
    container.appendChild(button);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return element path with id selector', () => {
    const path = getElementPath(button);
    expect(path).toContain('#test-button');
  });

  it('should return element path with class selector', () => {
    const path = getElementPath(span);
    expect(path).toContain('.btn-text');
  });

  it('should respect maxDepth parameter', () => {
    const path = getElementPath(span, 1);
    const parts = path.split(' > ');
    expect(parts.length).toBeLessThanOrEqual(1);
  });

  it('should stop at body or html', () => {
    const path = getElementPath(span, 10);
    expect(path).not.toContain('html');
    expect(path).toContain('button');
  });

  it('should handle element with only tag name', () => {
    const plainDiv = document.createElement('div');
    document.body.appendChild(plainDiv);
    const path = getElementPath(plainDiv);
    expect(path).toBe('div');
    document.body.removeChild(plainDiv);
  });

  it('should skip short class names and module hashes', () => {
    const el = document.createElement('div');
    el.className = 'ab xyz123 module_abc123';
    document.body.appendChild(el);
    const path = getElementPath(el);
    // Should skip 'ab' (too short) and 'module_abc123' (has hash)
    // 'xyz123' is kept
    expect(path).toContain('.xyz123');
    document.body.removeChild(el);
  });
});

describe('getNearbyText', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return own text content when short', () => {
    const span = document.createElement('span');
    span.textContent = 'Short text';
    container.appendChild(span);

    const result = getNearbyText(span);
    expect(result).toContain('Short text');
  });

  it('should include previous sibling text', () => {
    const prev = document.createElement('p');
    prev.textContent = 'Previous paragraph';
    const target = document.createElement('div');
    target.textContent = 'Target';

    container.appendChild(prev);
    container.appendChild(target);

    const result = getNearbyText(target);
    expect(result).toContain('[before: "Previous paragraph"]');
  });

  it('should include next sibling text', () => {
    const target = document.createElement('div');
    target.textContent = 'Target';
    const next = document.createElement('p');
    next.textContent = 'Next paragraph';

    container.appendChild(target);
    container.appendChild(next);

    const result = getNearbyText(target);
    expect(result).toContain('[after: "Next paragraph"]');
  });

  it('should truncate long text', () => {
    const target = document.createElement('div');
    target.textContent =
      'This is a very long text that exceeds the 100 character limit for nearby text extraction in the annotation system';

    container.appendChild(target);

    const result = getNearbyText(target);
    // Long text should not be included
    expect(result).toBe('');
  });
});

describe('identifyElement', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should identify button with text', () => {
    const button = document.createElement('button');
    button.textContent = 'Submit';
    container.appendChild(button);

    const result = identifyElement(button);
    expect(result.name).toContain('button');
    expect(result.name).toContain('Submit');
  });

  it('should identify button with aria-label', () => {
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Close dialog');
    container.appendChild(button);

    const result = identifyElement(button);
    expect(result.name).toContain('button');
    expect(result.name).toContain('Close dialog');
  });

  it('should identify link with text', () => {
    const link = document.createElement('a');
    link.href = 'https://example.com';
    link.textContent = 'Visit our site';
    container.appendChild(link);

    const result = identifyElement(link);
    expect(result.name).toContain('link');
    expect(result.name).toContain('Visit our site');
  });

  it('should identify input with placeholder', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('placeholder', 'Enter your name');
    container.appendChild(input);

    const result = identifyElement(input);
    expect(result.name).toContain('input');
    expect(result.name).toContain('Enter your name');
  });

  it('should identify heading elements', () => {
    const h1 = document.createElement('h1');
    h1.textContent = 'Main Title';
    container.appendChild(h1);

    const result = identifyElement(h1);
    expect(result.name).toContain('h1');
    expect(result.name).toContain('Main Title');
  });

  it('should identify paragraph', () => {
    const p = document.createElement('p');
    p.textContent = 'This is a paragraph';
    container.appendChild(p);

    const result = identifyElement(p);
    expect(result.name).toContain('paragraph');
    expect(result.name).toContain('This is a paragraph');
  });

  it('should identify image with alt text', () => {
    const img = document.createElement('img');
    img.src = 'placeholder.png';
    img.setAttribute('alt', 'Profile picture');
    container.appendChild(img);

    const result = identifyElement(img);
    expect(result.name).toContain('image');
    expect(result.name).toContain('Profile picture');
  });

  it('should use data-element attribute when present', () => {
    const div = document.createElement('div');
    div.dataset.element = 'custom-named-element';
    container.appendChild(div);

    const result = identifyElement(div);
    expect(result.name).toBe('custom-named-element');
  });

  it('should identify container divs', () => {
    const div = document.createElement('div');
    div.className = 'main-content';
    container.appendChild(div);

    const result = identifyElement(div);
    // Code splits className by [\s_-]+ so 'main-content' becomes 'main content'
    expect(result.name).toBe('main content');
  });
});

describe('identifyAnimationElement', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return data-element when present', () => {
    const el = document.createElement('div');
    el.dataset.element = 'animation-target';
    container.appendChild(el);

    const result = identifyAnimationElement(el);
    expect(result).toBe('animation-target');
  });

  it('should identify button with text', () => {
    const button = document.createElement('button');
    button.textContent = 'Click';
    container.appendChild(button);

    const result = identifyAnimationElement(button);
    expect(result).toContain('button');
    expect(result).toContain('Click');
  });

  it('should identify input with type', () => {
    const input = document.createElement('input');
    input.type = 'email';
    container.appendChild(input);

    const result = identifyAnimationElement(input);
    expect(result).toContain('input');
    expect(result).toContain('email');
  });

  it('should return tag name for unknown elements', () => {
    const article = document.createElement('article');
    container.appendChild(article);

    const result = identifyAnimationElement(article);
    expect(result).toBe('article');
  });
});

describe('closestCrossingShadow', () => {
  it('should find matching ancestor', () => {
    const inner = document.createElement('span');
    const outer = document.createElement('div');
    outer.className = 'target';

    outer.appendChild(inner); // inner is inside outer
    const result = closestCrossingShadow(inner, '.target');
    expect(result).toBe(outer);
  });

  it('should return null when no match', () => {
    const inner = document.createElement('span');
    const outer = document.createElement('div');
    outer.className = 'other';

    outer.appendChild(inner); // inner is inside outer
    const result = closestCrossingShadow(inner, '.nonexistent');
    expect(result).toBeNull();
  });
});

describe('isInShadowDOM', () => {
  it('should return false for elements not in shadow DOM', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    expect(isInShadowDOM(div)).toBe(false);

    document.body.removeChild(div);
  });
});

describe('getShadowHost', () => {
  it('should return null for elements not in shadow DOM', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    expect(getShadowHost(div)).toBeNull();

    document.body.removeChild(div);
  });
});

describe('getNearbyElements', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'parent-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return empty string when no siblings', () => {
    const onlyChild = document.createElement('div');
    container.appendChild(onlyChild);

    const result = getNearbyElements(onlyChild);
    expect(result).toBe('');
  });

  it('should return sibling identifiers', () => {
    const sibling1 = document.createElement('button');
    sibling1.className = 'btn-action';
    sibling1.textContent = 'Save';

    const target = document.createElement('button');
    target.className = 'btn-primary';
    target.textContent = 'Submit';

    const sibling2 = document.createElement('button');
    sibling2.className = 'btn-secondary';
    sibling2.textContent = 'Cancel';

    container.appendChild(sibling1);
    container.appendChild(target);
    container.appendChild(sibling2);

    const result = getNearbyElements(target);
    expect(result).toContain('button');
    expect(result).toContain('Save');
    expect(result).toContain('Cancel');
  });

  it('should indicate total siblings when more than shown', () => {
    const container2 = document.createElement('div');
    container.appendChild(container2);

    for (let i = 0; i < 6; i++) {
      const sibling = document.createElement('div');
      sibling.className = `item-${i}`;
      container2.appendChild(sibling);
    }

    const target = container2.querySelector('.item-0') as HTMLElement;
    const result = getNearbyElements(target);
    expect(result).toContain('total in');
  });
});

describe('getElementClasses', () => {
  it('should return cleaned class names', () => {
    const el = document.createElement('div');
    el.className = 'btn primary Component_abc123';
    document.body.appendChild(el);

    const result = getElementClasses(el);
    expect(result).toContain('btn');
    expect(result).toContain('primary');
    // module hash at end should be removed - Component_abc123 becomes Component
    expect(result).toContain('Component');
    expect(result).not.toContain('abc123');

    document.body.removeChild(el);
  });

  it('should return empty string for elements without classes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = getElementClasses(el);
    expect(result).toBe('');

    document.body.removeChild(el);
  });

  it('should deduplicate classes', () => {
    const el = document.createElement('div');
    el.className = 'btn primary btn';
    document.body.appendChild(el);

    const result = getElementClasses(el);
    const classes = result.split(', ');
    expect(classes.length).toBe(2); // 'btn' should not appear twice

    document.body.removeChild(el);
  });
});
