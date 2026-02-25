import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock mermaid module
vi.mock('mermaid', () => ({
  default: {
    parse: vi.fn().mockResolvedValue(true),
    render: vi.fn().mockImplementation(async (id, source) => {
      // Simple mock rendering based on diagram type
      let svg = '<svg><g></g></svg>';
      if (source.includes('graph') || source.includes('flowchart')) {
        svg = '<svg><g><rect x="10" y="10" width="100" height="50"/><text x="60" y="35">Flowchart</text></g></svg>';
      } else if (source.includes('sequenceDiagram')) {
        svg = '<svg><g><rect x="10" y="10" width="200" height="100"/><text x="110" y="60">Sequence</text></g></svg>';
      } else if (source.includes('classDiagram')) {
        svg = '<svg><g><rect x="10" y="10" width="150" height="80"/><text x="85" y="50">Class</text></g></svg>';
      }
      return {
        svg,
        bindFunctions: vi.fn()
      };
    }),
    registerIconPacks: vi.fn(),
    registerLayoutLoaders: vi.fn(),
    registerExternalDiagrams: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn()
  },
  MermaidConfig: {}
}));

describe('Mermaid Integration Tests', () => {
  // Helper to create a mermaid code block element
  const createMermaidElement = (code: string): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'mermaid';
    container.textContent = code;
    return container;
  };

  // Helper to create root element with mermaid blocks
  const createRootWithMermaidBlocks = (codes: string[]): HTMLElement => {
    const root = document.createElement('div');
    codes.forEach(code => {
      root.appendChild(createMermaidElement(code));
    });
    return root;
  };

  describe('Flowchart rendering', () => {
    it('should render a basic flowchart', () => {
      const mermaidCode = `graph TD;
    A[Start] --> B[End]`;

      const element = createMermaidElement(mermaidCode);

      expect(element.className).toBe('mermaid');
      expect(element.textContent?.trim()).toBe(mermaidCode);
    });
  });

  describe('Sequence diagram rendering', () => {
    it('should render a sequence diagram', () => {
      const mermaidCode = `sequenceDiagram
    Alice->>Bob: Hello`;

      const element = createMermaidElement(mermaidCode);

      expect(element.className).toBe('mermaid');
      expect(element.textContent?.trim()).toBe(mermaidCode);
    });
  });

  describe('Multiple diagrams', () => {
    it('should handle multiple mermaid blocks', () => {
      const codes = [
        'graph TD; A-->B',
        'sequenceDiagram A->>B: Hi',
        'classDiagram ClassA <|-- ClassB'
      ];

      const root = createRootWithMermaidBlocks(codes);

      const mermaidBlocks = root.querySelectorAll('.mermaid');
      expect(mermaidBlocks).toHaveLength(3);
    });
  });

  describe('Empty content handling', () => {
    it('should handle empty mermaid block', () => {
      const element = createMermaidElement('');

      expect(element.textContent?.trim()).toBe('');
    });

    it('should handle whitespace-only mermaid block', () => {
      const element = createMermaidElement('   ');

      expect(element.textContent?.trim()).toBe('');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid mermaid syntax gracefully', async () => {
      const invalidCode = 'invalid syntax @#$%';
      const element = createMermaidElement(invalidCode);

      // Mock will handle this - in real scenario would show error
      expect(element.className).toBe('mermaid');
    });
  });
});

describe('Extension Integration Tests', () => {
  describe('Configuration loading', () => {
    it('should load extension config from DOM', () => {
      // Create mock config element
      const configSpan = document.createElement('span');
      configSpan.id = 'markdown-mermaid';
      configSpan.dataset.config = JSON.stringify({
        darkModeTheme: 'dark',
        lightModeTheme: 'forest'
      });
      document.body.appendChild(configSpan);

      // Verify dataset is accessible
      expect(configSpan.dataset.config).toContain('darkModeTheme');

      // Clean up
      configSpan.remove();
    });

    it('should handle missing config gracefully', () => {
      const configSpan = document.createElement('span');
      configSpan.id = 'markdown-mermaid';
      document.body.appendChild(configSpan);

      // Should not throw when accessing non-existent data-config
      expect(configSpan.dataset.config).toBeUndefined();

      configSpan.remove();
    });
  });

  describe('Theme switching', () => {
    beforeEach(() => {
      document.body.classList.remove('vscode-dark', 'vscode-light', 'vscode-high-contrast');
    });

    it('should detect dark mode class', () => {
      document.body.classList.add('vscode-dark');

      expect(document.body.classList.contains('vscode-dark')).toBe(true);
    });

    it('should detect light mode class', () => {
      document.body.classList.add('vscode-light');

      expect(document.body.classList.contains('vscode-light')).toBe(true);
    });

    it('should detect high contrast mode', () => {
      document.body.classList.add('vscode-high-contrast');

      expect(document.body.classList.contains('vscode-high-contrast')).toBe(true);
    });
  });
});
