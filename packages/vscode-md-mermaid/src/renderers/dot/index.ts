/**
 * DOT renderer module.
 */
import type { DiagramRenderer } from "../../core/types";
import { renderDotBlocksInElement } from "./render";

export { initGraphviz, renderDotBlocksInElement, renderDot } from "./render";

/**
 * DOT renderer implementing DiagramRenderer interface
 */
export const dotRenderer: DiagramRenderer = {
  id: "dot",
  languages: ["dot"],
  className: "dot",

  renderElement(_container, _usedIds, _writeOut, _signal) {
    // Not implemented - uses renderInElement instead
    return undefined;
  },

  renderInElement(root, writeOut, signal) {
    return renderDotBlocksInElement(root, writeOut, signal);
  },
};
