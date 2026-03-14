import copy from 'copy-to-clipboard';

export function copyTextToClipboard(text: string): boolean {
  if (!text) {
    return false;
  }

  return copy(text);
}
