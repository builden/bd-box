import type { Skill } from '../primitives/skills-atom';

/**
 * 过滤 skills 列表
 */
export function calcFilterSkills(skills: Skill[], query: string): Skill[] {
  if (!query) return skills;
  const lower = query.toLowerCase();
  return skills.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.displayName.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower)
  );
}

/**
 * 根据名称查找 skill
 */
export function calcFindSkill(skills: Skill[], name: string): Skill | undefined {
  return skills.find((s) => s.name === name);
}

/**
 * 切换 skill 启用状态（本地更新）
 */
export function calcToggleSkill(skills: Skill[], name: string, enabled: boolean): Skill[] {
  return skills.map((s) => (s.name === name ? { ...s, enabled } : s));
}

/**
 * 更新 skill（本地更新）
 */
export function calcUpdateSkill(skills: Skill[], updated: Skill): Skill[] {
  const index = skills.findIndex((s) => s.name === updated.name);
  if (index >= 0) {
    const updatedList = [...skills];
    updatedList[index] = updated;
    return updatedList;
  }
  return skills;
}

/**
 * 移除 skill（本地更新）
 */
export function calcRemoveSkill(skills: Skill[], name: string): Skill[] {
  return skills.filter((s) => s.name !== name);
}
