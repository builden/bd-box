/**
 * File Permissions Utilities
 * Convert numeric permissions to rwx format
 */

/**
 * Convert numeric permission to rwx format
 * @param perm - Numeric permission (e.g., 0o755)
 * @returns Permission string (e.g., 'rwxr-xr-x')
 */
export function permToRwx(perm: number): string {
  const r = perm & 4 ? 'r' : '-';
  const w = perm & 2 ? 'w' : '-';
  const x = perm & 1 ? 'x' : '-';
  return r + w + x;
}
