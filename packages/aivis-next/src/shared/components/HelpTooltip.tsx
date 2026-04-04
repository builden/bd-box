import { useState } from 'react';
import { IconHelp } from './Icons';

interface HelpTooltipProps {
  content: string;
}

export function HelpTooltip({ content }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-0.5"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <IconHelp size={14} className="text-white/30" />
      {visible && (
        <span
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100020]"
          style={{
            padding: '6px 10px',
            background: '#383838',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '11px',
            lineHeight: '14px',
            borderRadius: '10px',
            width: '180px',
            textAlign: 'left' as const,
            boxShadow: '0px 1px 8px rgba(0, 0, 0, 0.28)',
            pointerEvents: 'none' as const,
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
