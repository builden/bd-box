import { describe, it, expect, vi } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders a default button', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const button = getByRole('button');
    expect(button).toBeDefined();
    expect(button.textContent).toBe('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);
    const button = getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies secondary variant classes', () => {
    const { getByRole } = render(<Button variant="secondary">Secondary</Button>);
    const button = getByRole('button');
    expect(button.className).toContain('bg-gray-200');
    expect(button.className).toContain('hover:bg-gray-300');
    expect(button.className).toContain('text-gray-800');
  });
});
