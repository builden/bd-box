import { atom } from 'jotai';
import { pluginsAtom } from '../primitives/plugins-atom';

/**
 * 启用的插件列表
 */
export const enabledPluginsAtom = atom((get) => {
  const plugins = get(pluginsAtom);
  return plugins.filter((p) => p.enabled);
});

/**
 * 禁用的插件列表
 */
export const disabledPluginsAtom = atom((get) => {
  const plugins = get(pluginsAtom);
  return plugins.filter((p) => !p.enabled);
});

/**
 * 插件数量
 */
export const pluginsCountAtom = atom((get) => {
  const plugins = get(pluginsAtom);
  return plugins.length;
});

/**
 * 启用的插件数量
 */
export const enabledPluginsCountAtom = atom((get) => {
  const enabled = get(enabledPluginsAtom);
  return enabled.length;
});
