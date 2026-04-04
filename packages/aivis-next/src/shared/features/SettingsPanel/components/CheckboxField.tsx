import { memo } from 'react';
import clsx from 'clsx';

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const CheckboxField = memo(function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false,
}: CheckboxFieldProps) {
  return (
    <label className={clsx('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50')}>
      <div className="relative w-3.5 h-3.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer peer"
        />
        <div
          className={clsx(
            'w-full h-full rounded-sm border transition-colors duration-150',
            'bg-checkbox-bg border-checkbox-border',
            'peer-checked:bg-checkbox-checked-bg peer-checked:border-checkbox-checked-border'
          )}
        />
        <svg
          className="absolute inset-0 w-3.5 h-3.5 pointer-events-none hidden peer-checked:block"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M3 7L6 10L11 4"
            stroke="var(--checkbox-check-mark)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-text-secondary text-[13px] tracking-tight">{label}</span>
    </label>
  );
});
