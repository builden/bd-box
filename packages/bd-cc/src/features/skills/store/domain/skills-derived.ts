import { atom } from 'jotai';
import { skillsAtom } from '../primitives/skills-atom';

/**
 * 启用的 skills 列表
 */
export const enabledSkillsAtom = atom((get) => {
  const skills = get(skillsAtom);
  return skills.filter((s) => s.enabled);
});

/**
 * 禁用的 skills 列表
 */
export const disabledSkillsAtom = atom((get) => {
  const skills = get(skillsAtom);
  return skills.filter((s) => !s.enabled);
});

/**
 * Skills 数量
 */
export const skillsCountAtom = atom((get) => {
  const skills = get(skillsAtom);
  return skills.length;
});

/**
 * 启用的 skills 数量
 */
export const enabledSkillsCountAtom = atom((get) => {
  const enabled = get(enabledSkillsAtom);
  return enabled.length;
});
