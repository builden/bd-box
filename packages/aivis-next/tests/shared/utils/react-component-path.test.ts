import { expect, test } from 'bun:test';
import { formatReactComponentPath, shouldIncludeReactComponentName } from '@/shared/utils/react-component-path';

test('filters noisy react wrapper components from the component path', () => {
  expect(shouldIncludeReactComponentName('ScopeProvider')).toBe(false);
  expect(shouldIncludeReactComponentName('BunshiMoleculeScopeContext')).toBe(false);
  expect(shouldIncludeReactComponentName('ThemeProvider')).toBe(false);
  expect(shouldIncludeReactComponentName('Button')).toBe(true);

  expect(
    formatReactComponentPath([
      '<div>',
      'ScopeProvider',
      'BunshiMoleculeScopeContext',
      'AppShell',
      'ThemeProvider',
      'SettingsPanel',
      'Button',
    ])
  ).toBe('<div> > AppShell > SettingsPanel > Button');
});
