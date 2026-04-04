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
        'flex items-center gap-2',
        'text-white text-[13px] font-medium tracking-tight',
        'cursor-pointer bg-transparent border-none p-0'
      )}
    >
      <span key={value} className="animate-cycle-text-in">
        {OUTPUT_DETAIL_OPTIONS.find((opt) => opt.value === value)?.label}
      </span>
      <div className="flex flex-col gap-0.5">
        {OUTPUT_DETAIL_OPTIONS.map((option) => (
          <span
            key={option.value}
            className={clsx(
              'w-[3px] h-[3px] rounded-full transition-all duration-150',
              value === option.value ? 'bg-white scale-100' : 'bg-white/30 scale-[0.667]'
            )}
          />
        ))}
      </div>
    </button>
  );
});
