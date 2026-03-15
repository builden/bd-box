import { useAtom } from 'jotai';
import { useEffect } from 'react';
import {
  editorThemeAtom,
  editorWordWrapAtom,
  editorMinimapAtom,
  editorLineNumbersAtom,
  editorFontSizeAtom,
  isDarkModeAtom,
  isWordWrapAtom,
  isMinimapEnabledAtom,
  isShowLineNumbersAtom,
  fontSizeValueAtom,
} from '../primitives/settings-atoms';
import { CODE_EDITOR_SETTINGS_CHANGED_EVENT } from '../../biz/settings';

/**
 * Code Editor 设置 Hook - 使用 atomWithStorage 自动持久化
 */
export function useCodeEditorSettings() {
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [wordWrap] = useAtom(isWordWrapAtom);
  const [minimapEnabled] = useAtom(isMinimapEnabledAtom);
  const [showLineNumbers] = useAtom(isShowLineNumbersAtom);
  const [fontSize] = useAtom(fontSizeValueAtom);

  const [, setTheme] = useAtom(editorThemeAtom);
  const [, setWordWrap] = useAtom(editorWordWrapAtom);
  const [, setMinimap] = useAtom(editorMinimapAtom);
  const [, setLineNumbers] = useAtom(editorLineNumbersAtom);
  const [, setFontSize] = useAtom(editorFontSizeAtom);

  // 保持向后兼容：设置变化时 dispatch 自定义事件
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(CODE_EDITOR_SETTINGS_CHANGED_EVENT));
  }, [isDarkMode, wordWrap, minimapEnabled, showLineNumbers, fontSize]);

  // 设置函数 - 内部使用字符串存储
  const setIsDarkMode = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const setWordWrapEnabled = (value: boolean) => {
    setWordWrap(value ? 'true' : 'false');
  };

  const setMinimapEnabled = (value: boolean) => {
    setMinimap(value ? 'true' : 'false');
  };

  const setShowLineNumbersEnabled = (value: boolean) => {
    setLineNumbers(value ? 'true' : 'false');
  };

  const setFontSizeValue = (value: number) => {
    setFontSize(String(value));
  };

  return {
    isDarkMode,
    setIsDarkMode,
    wordWrap,
    setWordWrap: setWordWrapEnabled,
    minimapEnabled,
    setMinimapEnabled,
    showLineNumbers,
    setShowLineNumbers: setShowLineNumbersEnabled,
    fontSize,
    setFontSize: setFontSizeValue,
  };
}
