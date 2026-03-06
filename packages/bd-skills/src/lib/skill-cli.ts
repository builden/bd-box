import pc from "picocolors";
import { execa } from "execa";

export interface AddOptions {
  global?: boolean;
  agent?: string;
  skill?: string;
  list?: boolean;
  yes?: boolean;
  copy?: boolean;
  all?: boolean;
  fullDepth?: boolean;
}

export interface RemoveOptions {
  global?: boolean;
  agent?: string;
  skill?: string;
  yes?: boolean;
  all?: boolean;
}

export type SkillOptions = AddOptions | RemoveOptions;

/**
 * Build args array for skills CLI
 */
export function buildSkillArgs(action: "add" | "remove", target: string, options: SkillOptions = {}): string[] {
  const args: string[] = [action, target];

  if (options.global) {
    args.push("-g");
  }

  // Only add default agent for add action
  if (action === "add" && !options.agent && !(options as AddOptions).all) {
    args.push("-a", "cline");
  }

  if (options.agent) {
    args.push("--agent", options.agent);
  }
  if (options.skill) {
    args.push("--skill", options.skill);
  }
  if ((options as AddOptions).list) {
    args.push("--list");
  }
  if (options.yes) {
    args.push("--yes");
  }
  if ((options as AddOptions).copy) {
    args.push("--copy");
  }
  if (options.all) {
    args.push("--all");
  }
  if ((options as AddOptions).fullDepth) {
    args.push("--full-depth");
  }

  return args;
}

/**
 * Execute skills CLI command
 */
export async function executeSkillCommand(
  action: "add" | "remove",
  target: string,
  options: SkillOptions = {},
): Promise<void> {
  const args = buildSkillArgs(action, target, options);

  console.log(pc.cyan(`${action === "add" ? "Adding" : "Removing"} skill: ${target}`));

  try {
    await execa("npx", ["-y", "skills", ...args], {
      stdio: "inherit",
    });
    console.log(pc.green(`Skill "${target}" ${action === "add" ? "added" : "removed"} successfully!`));
  } catch (error) {
    console.error(pc.red(`Failed to ${action} skill: ${target}`));
    if (error instanceof Error) {
      console.error(pc.red(error.message));
    }
    process.exit(1);
  }
}

/**
 * Add a skill
 */
export async function addSkill(source: string, options: AddOptions = {}): Promise<void> {
  await executeSkillCommand("add", source, options);
}

/**
 * Remove a skill
 */
export async function removeSkill(skillName: string, options: RemoveOptions = {}): Promise<void> {
  await executeSkillCommand("remove", skillName, options);
}
