#!/usr/bin/env bun

import { Command } from "commander";
import { addSkill, AddOptions, RemoveOptions } from "./lib/skill-cli";
import { listSkills } from "./commands/ls";
import { removeSkill } from "./commands/rm";
import { checkOutdated } from "./commands/outdated";
import { openSkills } from "./commands/open";
import { upgradeSelf } from "./commands/upgrade";
import { findSkills } from "./commands/find";

// Create program
const program = new Command();

program
  .name("bd-skills")
  .description("Skills manager for AI Agents - wrapper around vercel-labs/skills")
  .version("0.0.1");

// add command
program
  .command("add <source>")
  .description("Add a skill (supports: owner/repo, https://github.com/owner/repo)")
  .option("-g, --global", "Install skill globally (user-level) instead of project-level")
  .option("-a, --agent <agents>", "Specify agents to install to (use '*' for all agents)")
  .option("-s, --skill <skills>", "Specify skill names to install (use '*' for all skills)")
  .option("-l, --list", "List available skills in the repository without installing")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("--copy", "Copy files instead of symlinking to agent directories")
  .option("--all", "Shorthand for --skill '*' --agent '*' -y")
  .option("--full-depth", "Search all subdirectories even when a root SKILL.md exists")
  .action(async (source: string, options: AddOptions) => {
    await addSkill(source, options);
  });

// list command
program
  .command("list")
  .alias("ls")
  .description("List skills")
  .option("-g, --global", "List global ~/.agents skills instead of project-level")
  .action(async (options: { global?: boolean }) => {
    await listSkills(options.global);
  });

// remove command
program
  .command("remove <skill>")
  .alias("rm")
  .description("Remove a skill")
  .option("-g, --global", "Remove from global scope")
  .option("-a, --agent <agents>", "Remove from specific agents (use '*' for all agents)")
  .option("-s, --skill <skills>", "Specify skills to remove (use '*' for all skills)")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("--all", "Shorthand for --skill '*' --agent '*' -y")
  .action(async (skill: string, options: RemoveOptions) => {
    await removeSkill(skill, options);
  });

// outdated command
program
  .command("outdated")
  .alias("check")
  .description("Check if skills have updates")
  .option("-g, --global", "Check global ~/.agents directory instead of project-level")
  .action(async (options: { global?: boolean }) => {
    await checkOutdated(options.global);
  });

// open command
program
  .command("open [skill]")
  .description("Open skills directory or a specific skill")
  .option("-g, --global", "Open global ~/.agents directory instead of project-level")
  .action(async (skill?: string, options?: { global?: boolean }) => {
    await openSkills(skill, options?.global);
  });

// find command
program
  .command("find <query>")
  .description("Search for skills by keyword in global ~/.agents/skills")
  .action(async (query: string) => {
    await findSkills(query);
  });

// upgrade command
program
  .command("upgrade")
  .description("Upgrade bd-skills to the latest version")
  .action(async () => {
    await upgradeSelf();
  });

program.parse();
