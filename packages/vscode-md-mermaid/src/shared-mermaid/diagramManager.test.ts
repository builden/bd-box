import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiagramManager } from './diagramManager';
import { ShowControlsMode, ClickDragMode, MermaidExtensionConfig } from './config';

describe('DiagramManager', () => {
  let manager: DiagramManager;
  let config: MermaidExtensionConfig;

  // Helper to create SVG element
  const createSvgElement = (): SVGSVGElement => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);
    return svg;
  };

  // Helper to create container with SVG
  const createContainer = (): { container: HTMLDivElement; svg: SVGSVGElement } => {
    const container = document.createElement('div');
    const svg = createSvgElement();
    container.appendChild(svg);
    return { container, svg };
  };

  beforeEach(() => {
    config = {
      darkModeTheme: 'dark',
      lightModeTheme: 'default',
      maxTextSize: 50000,
      clickDrag: ClickDragMode.Alt,
      showControls: ShowControlsMode.OnHoverOrFocus,
      resizable: true,
      maxHeight: ''
    };
    manager = new DiagramManager(config);
  });

  describe('constructor', () => {
    it('should create a DiagramManager with config', () => {
      expect(manager).toBeDefined();
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      const newConfig: MermaidExtensionConfig = {
        ...config,
        showControls: ShowControlsMode.Always
      };

      manager.updateConfig(newConfig);
      expect(manager).toBeDefined();
    });
  });

  describe('setup', () => {
    it('should setup container with svg element', () => {
      const { container } = createContainer();

      const disposable = manager.setup('test-id', container);

      expect(disposable).toBeDefined();
      expect(typeof disposable.dispose).toBe('function');
    });

    it('should return disposable that can be called', () => {
      const { container } = createContainer();

      const disposable = manager.setup('test-id', container);
      disposable.dispose();

      expect(disposable).toBeDefined();
    });
  });

  describe('retainStates', () => {
    it('should handle empty active ids', () => {
      const { container } = createContainer();
      manager.setup('id1', container);

      const activeIds = new Set<string>();
      manager.retainStates(activeIds);

      expect(manager).toBeDefined();
    });

    it('should handle mixed active and inactive ids', () => {
      const { container } = createContainer();
      manager.setup('id1', container);
      manager.setup('id2', createContainer().container);

      const activeIds = new Set<string>(['id1', 'id3']);
      manager.retainStates(activeIds);

      expect(manager).toBeDefined();
    });
  });

  describe('config variations', () => {
    it('should not setup controls when showControls is Never', () => {
      const localConfig: MermaidExtensionConfig = {
        ...config,
        showControls: ShowControlsMode.Never
      };
      const localManager = new DiagramManager(localConfig);
      const { container } = createContainer();

      localManager.setup('test-id', container);

      const controls = container.querySelector('.mermaid-controls');
      expect(controls).toBeNull();
    });

    it('should setup controls when showControls is Always', () => {
      const localConfig: MermaidExtensionConfig = {
        ...config,
        showControls: ShowControlsMode.Always
      };
      const localManager = new DiagramManager(localConfig);
      const { container } = createContainer();

      localManager.setup('test-id', container);

      const controls = container.querySelector('.mermaid-controls');
      expect(controls).not.toBeNull();
    });

    it('should not setup resize when resizable is false', () => {
      const localConfig: MermaidExtensionConfig = {
        ...config,
        resizable: false
      };
      const localManager = new DiagramManager(localConfig);
      const { container } = createContainer();

      localManager.setup('test-id', container);

      const handle = container.querySelector('.mermaid-resize-handle');
      expect(handle).toBeNull();
    });

    it('should setup resize when resizable is true', () => {
      const localConfig: MermaidExtensionConfig = {
        ...config,
        resizable: true
      };
      const localManager = new DiagramManager(localConfig);
      const { container } = createContainer();

      localManager.setup('test-id', container);

      const handle = container.querySelector('.mermaid-resize-handle');
      expect(handle).not.toBeNull();
    });
  });
});
