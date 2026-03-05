declare module "open" {
  interface OpenOptions {
    app?: string | string[];
    wait?: boolean;
  }

  function open(target: string, options?: OpenOptions): Promise<void>;

  export default open;
}
