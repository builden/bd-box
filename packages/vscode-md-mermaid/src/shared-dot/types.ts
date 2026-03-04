export type DotLayoutEngine = "dot" | "neato" | "fdp" | "sfdp" | "twopi" | "circo";

export interface DotExtensionConfig {
  layoutEngine: DotLayoutEngine;
}
