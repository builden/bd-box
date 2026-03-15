export type ServiceFactory<T> = (container: Container) => T;

export interface ServiceOptions {
  singleton?: boolean;
}

export class Container {
  private factories = new Map<string, ServiceFactory<unknown>>();
  private singletons = new Map<string, unknown>();
  private options = new Map<string, ServiceOptions>();

  register<T>(name: string, factory: ServiceFactory<T>, options?: ServiceOptions): void {
    this.factories.set(name, factory);
    this.options.set(name, options ?? {});
  }

  registerInstance<T>(name: string, instance: T): void {
    this.singletons.set(name, instance);
    this.options.set(name, { singleton: true });
  }

  resolve<T>(name: string): T {
    const opts = this.options.get(name);

    // Check if singleton already exists
    if (opts?.singleton && this.singletons.has(name)) {
      return this.singletons.get(name) as T;
    }

    // Get factory and create instance
    const factory = this.factories.get(name);
    if (!factory) {
      // If no factory but has singleton instance (registered via registerInstance)
      if (this.singletons.has(name)) {
        return this.singletons.get(name) as T;
      }
      throw new Error(`Service not registered: ${name}`);
    }

    const instance = factory(this) as T;

    // Cache if singleton
    if (opts?.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  has(name: string): boolean {
    return this.factories.has(name) || this.singletons.has(name);
  }
}
