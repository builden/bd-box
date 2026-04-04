import { memo } from 'react';
import clsx from 'clsx';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Switch = memo(function Switch({ className = '', ...props }: SwitchProps) {
  return (
    <label className={clsx('relative inline-flex items-center cursor-pointer', className)}>
      <input type="checkbox" className="sr-only peer" {...props} />
      <div
        className={clsx(
          'w-[24px] h-[16px] rounded-full transition-colors duration-150',
          'bg-[#484848]', // dark mode off
          'peer-checked:bg-blue-500',
          'peer-disabled:opacity-30 peer-disabled:cursor-not-allowed'
        )}
      />
      <div
        className={clsx(
          'absolute left-[2px] top-[2px]',
          'w-[12px] h-[12px] rounded-full bg-white transition-transform duration-150',
          'peer-checked:translate-x-[8px]'
        )}
      />
    </label>
  );
});
