const deepUpdateObj = <T>(obj: T, path: string[], value: unknown): T => {
  if (path.length === 0) {
    return obj;
  }
  if (path.length === 1) {
    if (value === null || value === undefined) {
      const newObj = { ...obj } as Record<string, unknown>;
      delete newObj[path[0]];
      return newObj as T;
    }
    return {
      ...obj,
      [path[0]]: value,
    } as T;
  }

  const pathValue = deepUpdateObj(
    (obj as Record<string, unknown>)[path[0]] ?? {},
    path.slice(1),
    value,
  );
  if (
    pathValue === null ||
    pathValue === undefined ||
    Object.keys(pathValue).length === 0
  ) {
    const newObj = { ...obj } as Record<string, unknown>;
    delete newObj[path[0]];
    return newObj as T;
  }
  return {
    ...obj,
    [path[0]]: pathValue,
  } as T;
};

export default deepUpdateObj;
