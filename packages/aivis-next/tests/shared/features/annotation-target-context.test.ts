import '../../setup';

import { expect, test } from 'bun:test';
import { buildAnnotationTargetContext } from '@/shared/features/Annotation/annotation-target-context';

test('buildAnnotationTargetContext keeps click metadata shape', () => {
  document.body.innerHTML = `
    <main>
      <section class="panel panel-primary">
        <button id="save-btn" class="btn btn-primary" aria-label="Save draft">
          Save draft
        </button>
      </section>
    </main>
  `;

  const button = document.getElementById('save-btn') as HTMLButtonElement;
  const context = buildAnnotationTargetContext(button, 'Save');

  expect(context.element).toBe('<button> [Save draft]');
  expect(context.elementPath).toBe('button#save-btn.btn.btn-primary > section.panel.panel-primary');
  expect(context.fullPath).toBe('button#save-btn');
  expect(context.selectedText).toBe('Save');
  expect(context.cssClasses).toBe('btn btn-primary');
  expect(context.nearbyText).toContain('Save draft');
  expect(context.computedStyles).toContain('display:');
  expect(context.boundingBox).toMatchObject({
    x: 0,
    y: 0,
    width: expect.any(Number),
    height: expect.any(Number),
  });
});

test('buildAnnotationTargetContext keeps hover metadata shape', () => {
  document.body.innerHTML = `
    <main>
      <div data-element-path="main > section.panel.panel-primary">
        <button id="save-btn" class="btn btn-primary">
          Save draft
        </button>
      </div>
    </main>
  `;

  const button = document.getElementById('save-btn') as HTMLButtonElement;
  const context = buildAnnotationTargetContext(button, undefined, {
    includeForensic: false,
    labelVariant: 'hover',
    preferAnnotatedElementPath: true,
  });

  expect(context.element).toBe('<button> "Save draft"');
  expect(context.elementPath).toBe('main > section.panel.panel-primary');
  expect(context.fullPath).toBe('button#save-btn');
  expect(context.selectedText).toBeUndefined();
  expect(context.nearbyText).toBeUndefined();
  expect(context.computedStyles).toBeUndefined();
});

test('buildAnnotationTargetContext falls back when there is no useful text', () => {
  document.body.innerHTML = `<div id="plain"></div>`;

  const plain = document.getElementById('plain') as HTMLDivElement;
  const context = buildAnnotationTargetContext(plain);

  expect(context.element).toBe('<div>');
  expect(context.elementPath).toBe('div#plain');
  expect(context.fullPath).toBe('div#plain');
  expect(context.selectedText).toBeUndefined();
  expect(context.nearbyText).toBeUndefined();
});
