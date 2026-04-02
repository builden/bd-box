// Global type declarations

// Injected at build time
declare const __VERSION__: string;

// Optional peer dependency stub
declare module 'modern-screenshot' {
  export interface DomToCanvasOptions {
    backgroundColor?: string | null;
    timeout?: number;
    scale?: number;
  }
  export function domToCanvas(node: Node, options?: DomToCanvasOptions): Promise<HTMLCanvasElement>;
}
