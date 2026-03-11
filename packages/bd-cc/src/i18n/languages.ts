/**
 * Supported Languages Configuration
 *
 * This file contains the list of supported languages for the application.
 * Each language includes:
 * - value: Language code (e.g., 'en', 'zh-CN')
 * - label: Display name in English
 * - nativeName: Native language name for display
 */

export interface Language {
  value: string;
  label: string;
  nativeName: string;
}

export const languages: Language[] = [
  {
    value: "en",
    label: "English",
    nativeName: "English",
  },
  {
    value: "ko",
    label: "Korean",
    nativeName: "한국어",
  },
  {
    value: "zh-CN",
    label: "Simplified Chinese",
    nativeName: "简体中文",
  },
  {
    value: "ja",
    label: "Japanese",
    nativeName: "日本語",
  },
  {
    value: "ru",
    label: "Russian",
    nativeName: "Русский",
  },
];

/**
 * Get language object by value
 * @param value - Language code
 * @returns Language object or undefined if not found
 */
export const getLanguage = (value: string): Language | undefined => {
  return languages.find((lang) => lang.value === value);
};

/**
 * Get all language values
 * @returns Array of language codes
 */
export const getLanguageValues = (): string[] => {
  return languages.map((lang) => lang.value);
};

/**
 * Check if a language is supported
 * @param value - Language code to check
 * @returns True if language is supported
 */
export const isLanguageSupported = (value: string): boolean => {
  return languages.some((lang) => lang.value === value);
};
