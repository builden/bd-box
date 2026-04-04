import { memo } from 'react';
import clsx from 'clsx';
import { OUTPUT_DETAIL_OPTIONS } from '../store';
import type { OutputDetailLevel } from '../store';

interface OutputDetailCycleProps {
  value: OutputDetailLevel;
  onChange: (value: OutputDetailLevel) => void;
}

export const OutputDetailCycle = memo(function OutputDetailCycle({ value, onChange }: OutputDetailCycleProps) {
  const handleClick = () => {
    const currentIndex = OUTPUT_DETAIL_OPTIONS.findIndex((opt) => opt.value === value);
    const nextIndex = (currentIndex + 1) % OUTPUT_DETAIL_OPTIONS.length;
    const nextOption = OUTPUT_DETAIL_OPTIONS[nextIndex];
    if (nextOption) {
      onChange(nextOption.value);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'flex items-center gap-1.5 px-2 py-1 rounded-lg',
        'bg-white/5 hover:bg-white/10 transition-colors duration-150'
      )}
    >
      <span className="text-white text-xs">{OUTPUT_DETAIL_OPTIONS.find((opt) => opt.value === value)?.label}</span>
      <div className="flex gap-0.5">
        {OUTPUT_DETAIL_OPTIONS.map((option) => (
          <span
            key={option.value}
            className={clsx(
              'w-1 h-1 rounded-full transition-colors duration-150',
              value === option.value ? 'bg-blue-500' : 'bg-white/30'
            )}
          />
        ))}
      </div>
    </button>
  );
});
