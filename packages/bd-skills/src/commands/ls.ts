import pc from "picocolors";
import { execa } from "execa";

/**
 * List skills - delegates to skills CLI
 */
export async function listSkills(global: boolean = false): Promise<void> {
  try {
    const args = global ? ["ls", "-g"] : ["ls"];
    await execa("npx", ["-y", "skills", ...args], {
      stdio: "inherit",
    });
  } catch {
    // skills ls exits with error when no skills found
    if (global) {
      console.log(pc.yellow("No global skills found."));
      console.log(pc.gray("Use 'bd-skills add <source>' to add skills."));
    } else {
      console.log(pc.yellow("No project skills found."));
      console.log(pc.gray("Use 'bd-skills add <source>' to add skills."));
    }
  }
}
