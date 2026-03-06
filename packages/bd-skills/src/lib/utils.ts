import { homedir } from "os";
import { AGENTS_DIR, SKILLS_SUBDIR } from "./constants";

/**
 * Extract skill name from source URL or path
 */
export function extractSkillName(source: string): string {
  let name = source;

  // Remove URL prefix
  if (name.includes("github.com/")) {
    name = name.split("github.com/")[1];
  }

  // Remove .git suffix
  name = name.replace(/\.git$/, "");

  // Get the last part as skill name
  const parts = name.split("/");
  return parts[parts.length - 1] || name;
}

/**
 * Determine source type from source string
 */
export function getSourceType(source: string): "github" | "well-known" | "git" | "local" {
  if (source.startsWith("http") || source.includes("github.com") || source.includes("gitlab.com")) {
    return "github";
  }
  if (source.includes("/")) {
    return "git";
  }
  return "local";
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(dateStr: string): string {
  return dateStr.split("T")[0];
}

/**
 * Get global skills directory path
 */
export function getGlobalSkillsDir(): string {
  return `${homedir()}/${AGENTS_DIR}/${SKILLS_SUBDIR}`;
}

/**
 * Get global agents directory path
 */
export function getGlobalAgentsDir(): string {
  return `${homedir()}/${AGENTS_DIR}`;
}
