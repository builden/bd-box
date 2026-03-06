import { executeSkillCommand, AddOptions } from "../lib/skill-cli";

/**
 * Add a skill - delegates to skills CLI
 */
export async function addSkill(source: string, options: AddOptions = {}): Promise<void> {
  await executeSkillCommand("add", source, options);
}
