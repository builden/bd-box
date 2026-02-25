import type MarkdownIt from 'markdown-it';

// 使用 any 来避免复杂的 markdown-it 类型问题
/* eslint-disable @typescript-eslint/no-explicit-any */
type StateBlock = any;
type Token = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const mermaidLanguageId = 'mermaid';
const containerTokenName = 'mermaidContainer';

const min_markers = 3;
const marker_str = ':';
const marker_char = marker_str.charCodeAt(0);
const marker_len = marker_str.length;

/**
 * Extends markdown-it so that it can render mermaid diagrams.
 *
 * This does not actually implement rendering of mermaid diagrams. Instead we just make sure that mermaid
 * block syntax is properly parsed by markdown-it. All actual mermaid rendering happens in the webview
 * where the markdown is rendered.
 */
export function extendMarkdownItWithMermaid(md: MarkdownIt, config: { languageIds(): readonly string[] }) {
  // Code forked from markdown-it-container
  // Fork was done as we want to get the raw text inside container instead of treating it as markdown
  md.use((md: MarkdownIt) => {
    function container(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
      let pos: number;
      let auto_closed = false;
      let start = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];

      // Check out the first character quickly,
      // this should filter out most of non-containers
      //
      if (marker_char !== state.src.charCodeAt(start)) {
        return false;
      }

      // Cut off trailing white-spaces
      //
      for (pos = start + marker_len; pos < max; pos++) {
        const ch = state.src.charCodeAt(pos);
        if (ch !== 0x20) {
          break;
        }
      }

      const marker = state.src.slice(start, pos);
      const params = state.src.slice(pos, max);

      // Since start is found, we can report success here in validation mode
      //
      if (silent) {
        return true;
      }

      // Search for the end of the container
      //
      let nextLine = startLine;

      for (; ; ) {
        nextLine++;
        if (nextLine >= endLine) {
          // unclosed container
          break;
        }

        if (state.sCount[nextLine] < state.blkIndent) {
          // closed
          break;
        }

        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];

        if (state.src.charCodeAt(pos) !== marker_char) {
          continue;
        }

        for (pos = pos + marker_len; pos < max; pos++) {
          const ch = state.src.charCodeAt(pos);
          if (ch !== 0x20) {
            break;
          }
        }

        if (state.src.slice(pos, max) !== marker) {
          continue;
        }

        // found closing marker
        for (pos = pos + marker_len; pos < max; pos++) {
          const ch = state.src.charCodeAt(pos);
          if (ch !== 0x20) {
            break;
          }
        }

        auto_closed = true;
        break;
      }

      const oldLineMax = state.lineMax;
      state.lineMax = nextLine - startLine;

      const token = state.push(containerTokenName, 'Fence', 0);
      token.info = params;
      token.map = [startLine, nextLine];
      token.content = state.getLines(startLine + 1, nextLine, state.blkIndent, false);

      state.line = nextLine + (auto_closed ? 1 : 0);

      state.lineMax = oldLineMax;

      return true;
    }

    md.block.ruler.before('code', container as any, {
      alt: ['paragraph', 'reference', 'blockquote', 'list']
    } as any);

    md.renderer.rules[containerTokenName] = (tokens: Token[], idx: number) => {
      const token = tokens[idx];
      const src = token.content;

      const id = `mermaid-${idx}`;

      return `<div class="mermaid-container" data-mermaid-diagram-id="${id}" data-language="${mermaidLanguageId}"><pre class="mermaid">${src}</pre></div>`;
    };
  });

  // Return actual params of nan闭合 HTML 容器.
  return md;
}
