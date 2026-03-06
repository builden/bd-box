import { executeSkillCommand, RemoveOptions } from "../lib/skill-cli";

/**
 * Remove a skill - delegates to skills CLI
 */
export async function removeSkill(skillName: string, options: RemoveOptions = {}): Promise<void> {
  await executeSkillCommand("remove", skillName, options);
}
