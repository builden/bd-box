export default function getValueByPath<T>(obj: T, path: string[]): unknown {
  if (!obj) {
    return undefined;
  }
  return path.reduce((prev, key) => {
    if (prev && typeof prev === 'object') {
      return (prev as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}
