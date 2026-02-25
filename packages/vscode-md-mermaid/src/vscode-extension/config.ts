import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { ClickDragMode, ShowControlsMode, defaultMermaidTheme, validMermaidThemes } from '../shared-mermaid/config';

export const configSection = 'markdown-mermaid';

function sanitizeMermaidTheme(theme: string | undefined) {
  return typeof theme === 'string' && validMermaidThemes.includes(theme as typeof validMermaidThemes[number]) ? theme : defaultMermaidTheme;
}

export function injectMermaidConfig(md: MarkdownIt) {
  const render = md.renderer.render;
  md.renderer.render = function (...args) {
    const config = vscode.workspace.getConfiguration(configSection);
    const configData = {
      darkModeTheme: sanitizeMermaidTheme(config.get('darkModeTheme')),
      lightModeTheme: sanitizeMermaidTheme(config.get('lightModeTheme')),
      maxTextSize: config.get('maxTextSize') as number,
      clickDrag: config.get('mouseNavigation.enabled', ClickDragMode.Alt),
      showControls: config.get('controls.show', ShowControlsMode.OnHoverOrFocus),
      resizable: config.get('resizable', true),
      maxHeight: config.get('maxHeight', ''),
    };

    const escapedConfig = escapeHtmlAttribute(JSON.stringify(configData));
    return `<span id="markdown-mermaid" data-config="${escapedConfig}"></span>
${render.apply(md.renderer, args)}`;
  };
  return md;
}

function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}
