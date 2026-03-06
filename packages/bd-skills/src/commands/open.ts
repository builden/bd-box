import pc from "picocolors";
import { open } from "@builden/bd-utils";
import { existsSync } from "fs";
import { cwd } from "process";
import { getGlobalAgentsDir, getGlobalSkillsDir } from "../lib/utils";

export async function openSkills(pattern?: string, global: boolean = false): Promise<void> {
  // If pattern is provided, try to find matching skill in lock file
  if (pattern) {
    const { findSkillInLock } = await import("../lib/lock");
    const skill = await findSkillInLock(pattern);

    if (!skill) {
      console.error(pc.red(`No skill matching "${pattern}" found`));
      console.log(pc.gray(`\nUse 'bd-skills open' without a pattern to open skills directory.`));
      process.exit(1);
    }

    console.log(pc.green(`Opening ${skill.name}...`));
    if (skill.sourceUrl?.startsWith("http")) {
      await open(skill.sourceUrl);
    } else {
      await open(getGlobalSkillsDir());
    }
    return;
  }

  // No pattern: open skills directory
  if (global) {
    const skillsDir = getGlobalAgentsDir();
    console.log(pc.green(`Opening global skills directory...`));
    console.log(pc.gray(skillsDir));
    await open(skillsDir);
  } else {
    const currentDir = cwd();
    const skillsDir = `${currentDir}/skills`;
    if (existsSync(skillsDir)) {
      console.log(pc.green(`Opening project skills directory...`));
      console.log(pc.gray(skillsDir));
      await open(skillsDir);
    } else {
      console.log(pc.yellow("No skills directory found in current project."));
      console.log(pc.gray("Use 'bd-skills open -g' to open global ~/.agents directory."));
    }
  }
}
