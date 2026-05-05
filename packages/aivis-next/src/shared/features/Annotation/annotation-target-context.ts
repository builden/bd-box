export type AnnotationTargetContext = {
  element: string;
  elementPath: string;
  fullPath: string;
  selectedText?: string;
  rect: DOMRect;
  cssClasses?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  computedStyles?: string;
};

export type AnnotationTargetContextOptions = {
  includeForensic?: boolean;
  labelVariant?: 'click' | 'hover';
  preferAnnotatedElementPath?: boolean;
};

export function buildAnnotationTargetContext(
  target: HTMLElement,
  selectionText?: string,
  options: AnnotationTargetContextOptions = {}
): AnnotationTargetContext {
  const includeForensic = options.includeForensic ?? true;
  const labelVariant = options.labelVariant ?? 'click';
  const rect = target.getBoundingClientRect();
  const element = getElementLabel(target, labelVariant);
  const elementPath = options.preferAnnotatedElementPath ? getAnnotatedElementPath(target) : getElementPath(target);
  const fullPath = getFullPath(target);
  const context: AnnotationTargetContext = {
    element,
    elementPath,
    fullPath,
    rect,
    ...(selectionText ? { selectedText: selectionText } : {}),
  };

  if (typeof target.className === 'string' && target.className.trim()) {
    context.cssClasses = target.className;
  }

  context.boundingBox = {
    x: rect.left,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };

  if (!includeForensic) {
    return context;
  }

  const nearbyText = getNearbyText(target);
  if (nearbyText) {
    context.nearbyText = nearbyText;
  }

  const computedStyles = getKeyComputedStyles(target);
  if (computedStyles) {
    context.computedStyles = computedStyles;
  }

  return context;
}

function getAnnotatedElementPath(target: HTMLElement): string {
  const annotated = target.closest('[data-element-path]') as HTMLElement | null;
  return annotated?.dataset.elementPath || getElementPath(target);
}

function getElementPath(target: HTMLElement): string {
  const path: string[] = [];
  let current: Element | null = target;

  while (current && current !== document.body && path.length < 5) {
    const tag = current.tagName.toLowerCase();
    const el = current as HTMLElement;
    const id = el.id ? `#${el.id}` : '';
    const className = typeof el.className === 'string' ? el.className : '';
    const classes = className ? '.' + className.split(' ').filter(Boolean).slice(0, 2).join('.') : '';
    if (id || classes) {
      path.push(`${tag}${id}${classes}`);
    }
    current = current.parentElement;
  }

  return path.join(' > ') || target.tagName.toLowerCase();
}

function getFullPath(target: HTMLElement): string {
  const path: string[] = [];
  let current: Element | null = target;

  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const el = current as HTMLElement;
    let selector = tag;

    if (el.id) {
      selector = `${tag}#${el.id}`;
      path.unshift(selector);
      break;
    }

    const className = typeof el.className === 'string' ? el.className : '';
    if (className) {
      const classes = className.split(' ').filter(Boolean);
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 3).join('.');
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

function getNearbyText(target: HTMLElement): string {
  const directText = target.textContent?.trim() || '';

  if (directText.length > 100) {
    const parent = target.parentElement;
    if (parent) {
      return parent.textContent?.trim().slice(0, 150) || '';
    }
  }

  return directText.slice(0, 100);
}

function getKeyComputedStyles(target: HTMLElement): string {
  const styles = window.getComputedStyle(target);

  const keyProperties = [
    'display',
    'flex-direction',
    'justify-content',
    'align-items',
    'gap',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'width',
    'height',
    'padding',
    'margin',
    'background-color',
    'color',
    'font-size',
    'font-weight',
  ];

  const entries = keyProperties
    .map((property) => {
      const value = styles.getPropertyValue(property);
      return value ? `${property}: ${value}` : '';
    })
    .filter(Boolean);

  return entries.join('; ');
}

function getElementLabel(target: HTMLElement, variant: 'click' | 'hover'): string {
  const tag = target.tagName.toLowerCase();

  if (variant === 'click') {
    if (target.getAttribute('aria-label')) {
      return `<${tag}> [${target.getAttribute('aria-label')}]`;
    }

    const accessibleName = target.getAttribute('name') || target.getAttribute('alt') || target.getAttribute('title');
    if (accessibleName) {
      return `<${tag}> "${accessibleName.slice(0, 30)}"`;
    }

    return `<${tag}>`;
  }

  if (target.getAttribute('aria-label')) {
    return target.getAttribute('aria-label')!;
  }

  const accessibleName = target.getAttribute('name') || target.getAttribute('alt') || target.getAttribute('title');
  if (accessibleName) {
    return accessibleName;
  }

  const text = target.textContent?.trim().slice(0, 50) || '';
  if (text) {
    return `<${tag}> "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`;
  }

  return `<${tag}>`;
}
