import type { OutputDetailLevel } from '@/shared/features/SettingsPanel/store';
import type { Annotation } from './store';

/**
 * 根据输出详情级别生成标注反馈文本
 * 参考 aivis/src/utils/generate-output.ts
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
      // Compact: 元素标签 + DOM路径 + 评论
      output += `${i + 1}. **${a.element}**`;
      if (a.elementPath) {
        output += ` (${a.elementPath})`;
      }
      output += `: ${a.comment || '(无评论)'}`;
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
      if (a.popupX !== undefined && a.popupY !== undefined) {
        output += `**标注位置:** 左侧 ${a.x.toFixed(1)}px, 顶部 ${Math.round(a.y)}px\n`;
      }
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
      output += `**反馈:** ${a.comment || '(无评论)'}\n\n`;
    } else {
      // standard and detailed
      output += `### ${i + 1}. ${a.element}\n`;
      output += `**位置:** ${a.elementPath || ''}\n`;
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
        } else if (a.popupX !== undefined && a.popupY !== undefined) {
          output += `**像素位置:** ${Math.round(a.x)}px, ${Math.round(a.y)}px\n`;
        }
      }
      if (a.selectedText) {
        output += `**选中文本:** "${a.selectedText}"\n`;
      }
      if (detailLevel === 'detailed' && a.nearbyText && !a.selectedText) {
        output += `**上下文:** ${a.nearbyText.slice(0, 100)}\n`;
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
