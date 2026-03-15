import { STATUS_OPTIONS } from './constants';

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <select
      value={value ?? 'pending'}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
