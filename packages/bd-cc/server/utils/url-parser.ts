/**
 * URL Parser Utilities
 * Extract and process URLs from terminal output
 */

const ANSI_ESCAPE_SEQUENCE_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g;
const TRAILING_URL_PUNCTUATION_REGEX = /[)\]}>.,;:!?]+$/;

export function stripAnsiSequences(value = ''): string {
  return value.replace(ANSI_ESCAPE_SEQUENCE_REGEX, '');
}

export function normalizeDetectedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const cleaned = url.trim().replace(TRAILING_URL_PUNCTUATION_REGEX, '');
  if (!cleaned) return null;

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function extractUrlsFromText(value: string): string[] {
  const directMatches = value.match(/https?:\/\/[^\s<>"'`\\\x1b\x07]+/gi) || [];

  // Handle wrapped terminal URLs split across lines by terminal width.
  const wrappedMatches: string[] = [];
  const continuationRegex = /^[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$/;
  const lines = value.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const startMatch = line.match(/https?:\/\/[^\s<>"'`\\\x1b\x07]+/i);
    if (!startMatch) continue;

    let combined = startMatch[0];
    let j = i + 1;
    while (j < lines.length) {
      const continuation = lines[j].trim();
      if (!continuation) break;
      if (!continuationRegex.test(continuation)) break;
      combined += continuation;
      j++;
    }

    wrappedMatches.push(combined.replace(/\r?\n\s*/g, ''));
  }

  return Array.from(new Set([...directMatches, ...wrappedMatches]));
}

export function shouldAutoOpenUrlFromOutput(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("browser didn't open") ||
    normalized.includes('open this url') ||
    normalized.includes('continue in your browser') ||
    normalized.includes('press enter to open') ||
    normalized.includes('open_url:')
  );
}
