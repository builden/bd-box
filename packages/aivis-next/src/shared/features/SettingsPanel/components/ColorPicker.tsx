import { memo } from 'react';
import clsx from 'clsx';
import { COLOR_OPTIONS } from '../store';

interface ColorPickerProps {
  value: string;
  onChange: (colorId: string) => void;
}

export const ColorPicker = memo(function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex justify-between items-center mt-1.5 h-[26px]">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color.id}
          onClick={() => onChange(color.id)}
          className="relative w-5 h-5 rounded-full cursor-pointer"
          style={{ backgroundColor: '#1a1a1a' }}
          title={color.label}
        >
          {/* Inner circle */}
          <span
            className={clsx(
              'absolute inset-0 rounded-full transition-transform duration-200',
              value === color.id ? 'scale-[0.8]' : 'scale-100'
            )}
            style={{ backgroundColor: color.srgb }}
          />
          {/* Outer ring - visible when selected */}
          <span
            className={clsx(
              'absolute inset-0 rounded-full -z-10 transition-opacity duration-200',
              value === color.id ? 'opacity-100' : 'opacity-0'
            )}
            style={{ backgroundColor: color.srgb, transform: 'scale(1.2)' }}
          />
        </button>
      ))}
    </div>
  );
});
