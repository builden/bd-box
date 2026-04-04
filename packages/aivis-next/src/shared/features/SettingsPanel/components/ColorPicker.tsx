import { memo } from 'react';
import clsx from 'clsx';
import { COLOR_OPTIONS } from '../store';

interface ColorPickerProps {
  value: string;
  onChange: (colorId: string) => void;
}

export const ColorPicker = memo(function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color.id}
          onClick={() => onChange(color.id)}
          className={clsx(
            'w-6 h-6 rounded-full transition-all duration-150',
            'hover:scale-110',
            value === color.id ? 'ring-2 ring-offset-2 ring-offset-[#1a1a1a]' : ''
          )}
          style={{
            backgroundColor: color.srgb,
            ...(value === color.id && ({ '--tw-ring-color': color.srgb } as React.CSSProperties)),
          }}
          title={color.label}
        />
      ))}
    </div>
  );
});
