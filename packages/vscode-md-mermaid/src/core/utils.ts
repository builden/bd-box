/**
 * Core utility functions.
 * These supplement the existing utilities in shared-mermaid/utils
 */

/**
 * Generate hash from string
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate unique content ID
 */
export function generateContentId(source: string, usedIds: Set<string>): string {
  let id = "dmermaid" + hashString(source);
  let counter = 0;
  while (usedIds.has(id)) {
    id = "dmermaid" + hashString(source + counter);
    counter++;
  }
  usedIds.add(id);
  return id;
}
