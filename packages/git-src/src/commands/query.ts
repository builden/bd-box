import { Config } from "../lib/config";
import { renderTable } from "./table";

export async function searchRepos(pattern: string, options: { tag?: string } = {}): Promise<void> {
  const config = new Config();
  let repos = config.getRepos();

  // Filter by tag if specified
  if (options.tag) {
    repos = repos.filter((r) => r.tags.includes(options.tag!));
  }

  // Filter by pattern (supports wildcards)
  if (pattern) {
    // Convert glob pattern to regex: * -> .*, ? -> ., others escaped
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special regex chars except * and ?
      .replace(/\*/g, ".*") // * -> .*
      .replace(/\?/g, "."); // ? -> .
    const regex = new RegExp(regexPattern, "i");
    repos = repos.filter((r) => regex.test(r.fullName));
  }

  // Use renderTable for consistent display
  await renderTable(repos, options);
}
