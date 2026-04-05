import type { OutputDetailLevel } from '@/shared/features/SettingsPanel/store';
import type { Annotation } from './store';

/**
 * 根据输出详情级别生成标注反馈文本
 */
export function generateAnnotationOutput(
  annotations: Annotation[],
  detailLevel: OutputDetailLevel = 'standard'
): string {
  if (annotations.length === 0) return '';

  const pathname =
    typeof window !== 'undefined' ? window.location.pathname + window.location.search + window.location.hash : '';

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
      output += `${i + 1}. **${a.element}**: ${a.comment || '(无评论)'}`;
      if (a.selectedText) {
        output += ` (引用: "${a.selectedText.slice(0, 30)}${a.selectedText.length > 30 ? '...' : ''}")`;
      }
      output += '\n';
    } else if (detailLevel === 'forensic') {
      output += `### ${i + 1}. ${a.element}\n`;
      if (a.popupX !== undefined && a.popupY !== undefined) {
        output += `**标注位置:** 左侧 ${a.x.toFixed(1)}px, 顶部 ${a.y.toFixed(1)}px\n`;
      }
      if (a.selectedText) {
        output += `**选中文本:** "${a.selectedText}"\n`;
      }
      output += `**反馈:** ${a.comment || '(无评论)'}\n\n`;
    } else {
      // standard and detailed
      output += `### ${i + 1}. ${a.element}\n`;
      if (detailLevel === 'detailed') {
        if (a.popupX !== undefined && a.popupY !== undefined) {
          output += `**位置:** ${Math.round(a.x)}px, ${Math.round(a.y)}px\n`;
        }
      }
      if (a.selectedText) {
        output += `**选中文本:** "${a.selectedText}"\n`;
      }
      output += `**反馈:** ${a.comment || '(无评论)'}\n\n`;
    }
  });

  return output.trim();
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
