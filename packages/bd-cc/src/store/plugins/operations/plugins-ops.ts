import type { Plugin } from '../primitives/plugins-atom';

/**
 * 过滤插件列表
 */
export function calcFilterPlugins(plugins: Plugin[], query: string): Plugin[] {
  if (!query) return plugins;
  const lower = query.toLowerCase();
  return plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.displayName.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
}

/**
 * 根据名称查找插件
 */
export function calcFindPlugin(plugins: Plugin[], name: string): Plugin | undefined {
  return plugins.find((p) => p.name === name);
}

/**
 * 切换插件启用状态（本地更新）
 */
export function calcTogglePlugin(plugins: Plugin[], name: string, enabled: boolean): Plugin[] {
  return plugins.map((p) => (p.name === name ? { ...p, enabled } : p));
}

/**
 * 更新插件列表（本地更新）
 */
export function calcUpdatePlugin(plugins: Plugin[], updated: Plugin): Plugin[] {
  const index = plugins.findIndex((p) => p.name === updated.name);
  if (index >= 0) {
    const updatedList = [...plugins];
    updatedList[index] = updated;
    return updatedList;
  }
  return plugins;
}

/**
 * 移除插件（本地更新）
 */
export function calcRemovePlugin(plugins: Plugin[], name: string): Plugin[] {
  return plugins.filter((p) => p.name !== name);
}
