import { OutputDetailLevel, ReactComponentMode } from '../components/page-toolbar-css';
import { Annotation } from '../types';

export const OUTPUT_TO_REACT_MODE: Record<OutputDetailLevel, ReactComponentMode> = {
  compact: 'off',
  standard: 'filtered',
  detailed: 'smart',
  forensic: 'all',
};

export const OUTPUT_DETAIL_OPTIONS: {
  value: OutputDetailLevel;
  label: string;
}[] = [
  { value: 'compact', label: '简洁' },
  { value: 'standard', label: '标准' },
  { value: 'detailed', label: '详细' },
  { value: 'forensic', label: '取证' },
];

export function generateOutput(
  annotations: Annotation[],
  pathname: string,
  detailLevel: OutputDetailLevel = 'standard'
): string {
  if (annotations.length === 0) return '';

  const viewport = typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : 'unknown';

  let output = `## 页面反馈: ${pathname}\n`;

  if (detailLevel === 'forensic') {
    output += `\n**环境:**\n`;
    output += `- 视口: ${viewport}\n`;
    if (typeof window !== 'undefined') {
      output += `- URL: ${window.location.href}\n`;
      output += `- User Agent: ${navigator.userAgent}\n`;
      output += `- 时间戳: ${new Date().toISOString()}\n`;
      output += `- 设备像素比: ${window.devicePixelRatio}\n`;
    }
    output += `\n---\n`;
  } else if (detailLevel !== 'compact') {
    output += `**视口:** ${viewport}\n`;
  }
  output += '\n';

  annotations.forEach((a, i) => {
    if (detailLevel === 'compact') {
      output += `${i + 1}. **${a.element}**${a.sourceFile ? ` (${a.sourceFile})` : ''}: ${a.comment}`;
      if (a.selectedText) {
        output += ` (re: "${a.selectedText.slice(0, 30)}${a.selectedText.length > 30 ? '...' : ''}")`;
      }
      output += '\n';
    } else if (detailLevel === 'forensic') {
      output += `### ${i + 1}. ${a.element}\n`;
      if (a.isMultiSelect && a.fullPath) {
        output += `*显示选择中第一个元素的取证数据*\n`;
      }
      if (a.fullPath) {
        output += `**完整 DOM 路径:** ${a.fullPath}\n`;
      }
      if (a.cssClasses) {
        output += `**CSS 类:** ${a.cssClasses}\n`;
      }
      if (a.boundingBox) {
        output += `**位置:** x:${Math.round(a.boundingBox.x)}, y:${Math.round(a.boundingBox.y)} (${Math.round(a.boundingBox.width)}×${Math.round(a.boundingBox.height)}px)\n`;
      }
      output += `**标注位置:** 左侧 ${a.x.toFixed(1)}%, 顶部 ${Math.round(a.y)}px\n`;
      if (a.selectedText) {
        output += `**选中文本:** "${a.selectedText}"\n`;
      }
      if (a.nearbyText && !a.selectedText) {
        output += `**上下文:** ${a.nearbyText.slice(0, 100)}\n`;
      }
      if (a.computedStyles) {
        output += `**计算样式:** ${a.computedStyles}\n`;
      }
      if (a.accessibility) {
        output += `**无障碍:** ${a.accessibility}\n`;
      }
      if (a.nearbyElements) {
        output += `**附近元素:** ${a.nearbyElements}\n`;
      }
      if (a.sourceFile) {
        output += `**源码:** ${a.sourceFile}\n`;
      }
      if (a.reactComponents) {
        output += `**React:** ${a.reactComponents}\n`;
      }
      output += `**反馈:** ${a.comment}\n\n`;
    } else {
      // standard and detailed
      output += `### ${i + 1}. ${a.element}\n`;
      output += `**位置:** ${a.elementPath}\n`;
      if (a.sourceFile) {
        output += `**源码:** ${a.sourceFile}\n`;
      }
      if (a.reactComponents) {
        output += `**React:** ${a.reactComponents}\n`;
      }
      if (detailLevel === 'detailed') {
        if (a.cssClasses) {
          output += `**类:** ${a.cssClasses}\n`;
        }
        if (a.boundingBox) {
          output += `**位置:** ${Math.round(a.boundingBox.x)}px, ${Math.round(a.boundingBox.y)}px (${Math.round(a.boundingBox.width)}×${Math.round(a.boundingBox.height)}px)\n`;
        }
      }
      if (a.selectedText) {
        output += `**选中文本:** "${a.selectedText}"\n`;
      }
      if (detailLevel === 'detailed' && a.nearbyText && !a.selectedText) {
        output += `**上下文:** ${a.nearbyText.slice(0, 100)}\n`;
      }
      output += `**反馈:** ${a.comment}\n\n`;
    }
  });

  return output.trim();
}
