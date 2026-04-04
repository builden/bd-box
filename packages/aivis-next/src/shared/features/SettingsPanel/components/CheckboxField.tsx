import { memo } from 'react';
import clsx from 'clsx';
import { Switch } from '@/shared/components/Switch';

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
    <label className={clsx('flex items-center justify-between cursor-pointer', disabled && 'opacity-50')}>
      <span className="text-white/60">{label}</span>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    </label>
  );
});
