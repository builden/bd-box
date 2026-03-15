import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from './container';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it('should register and resolve service', () => {
    // Arrange
    const factory = (c: Container) => ({ name: 'test-service' });

    // Act
    container.register('test', factory);
    const instance = container.resolve<{ name: string }>('test');

    // Assert
    expect(instance).toEqual({ name: 'test-service' });
  });

  it('should support singleton registration', () => {
    // Arrange
    let callCount = 0;
    const factory = (c: Container) => {
      callCount++;
      return { id: callCount };
    };

    // Act
    container.register('singleton', factory, { singleton: true });
    const instance1 = container.resolve<{ id: number }>('singleton');
    const instance2 = container.resolve<{ id: number }>('singleton');

    // Assert
    expect(instance1).toEqual({ id: 1 });
    expect(instance2).toEqual({ id: 1 });
    expect(callCount).toBe(1);
  });

  it('should register instance directly', () => {
    // Arrange
    const instance = { name: 'direct-instance' };

    // Act
    container.registerInstance('direct', instance);
    const resolved = container.resolve<{ name: string }>('direct');

    // Assert
    expect(resolved).toEqual({ name: 'direct-instance' });
    expect(resolved).toBe(instance);
  });

  it('should return true for has() when service is registered', () => {
    container.register('test', (c) => ({}));
    expect(container.has('test')).toBe(true);
  });

  it('should return false for has() when service is not registered', () => {
    expect(container.has('non-existent')).toBe(false);
  });
});
