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
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100020] py-1.5 px-2.5 bg-[#383838] text-white/70 text-[11px] leading-[14px] rounded-[10px] w-[200px] text-left shadow-[0_1px_8px_rgba(0,0,0,0.28)] pointer-events-none whitespace-pre-line">
          {content}
        </span>
      )}
    </span>
  );
}
