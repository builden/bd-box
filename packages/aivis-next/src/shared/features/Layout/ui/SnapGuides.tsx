import { memo } from 'react';
import type { SnapGuide } from '../types';

interface SnapGuidesProps {
  guides: SnapGuide[];
}

/**
 * SnapGuides - 吸附对齐引导线组件
 * 在接近其他组件边缘时显示垂直/水平引导线
 */
export const SnapGuides = memo(function SnapGuides({ guides }: SnapGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <div className="pointer-events-none z-[100003]" style={{ position: 'fixed', inset: 0 }}>
      <svg width="100vw" height="100vh" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {guides.map((guide, i) => (
          <GuideLine key={i} guide={guide} />
        ))}
      </svg>
    </div>
  );
});

function GuideLine({ guide }: { guide: SnapGuide }) {
  if (guide.type === 'vertical') {
    return (
      <line x1={guide.position} y1={0} x2={guide.position} y2="100%" stroke="#f0f" strokeWidth={1} opacity={0.5} />
    );
  }

  return <line x1={0} y1={guide.position} x2="100%" y2={guide.position} stroke="#f0f" strokeWidth={1} opacity={0.5} />;
}
