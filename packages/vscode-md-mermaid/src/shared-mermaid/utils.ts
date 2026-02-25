/**
 * Generate a simple hash from a string for content-based IDs.
 * Uses a fast non-cryptographic hash suitable for deduplication.
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and ensure positive
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateContentId(source: string, usedIds: Set<string>): string {
  const hash = hashString(source);
  let id = `mermaid-${hash}`;
  let counter = 0;

  // Handle collisions by appending a counter
  while (usedIds.has(id)) {
    counter++;
    id = `mermaid-${hash}-${counter}`;
  }

  usedIds.add(id);
  return id;
}
