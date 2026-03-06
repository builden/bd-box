import pc from "picocolors";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, basename } from "path";
import { getGlobalSkillsDir } from "../lib/utils";

// File extensions to search
const SEARCH_EXTENSIONS = [".md", ".txt", ".json", ".yml", ".yaml", ".ts", ".js"];

// Directories to skip during search
const SKIP_DIRS = ["node_modules", ".git", "dist", "build", ".next"];

interface SearchResult {
  skill: string;
  file: string;
  line: number;
  content: string;
  lowerContent: string;
}

/**
 * Search for a query in a directory recursively
 */
function searchInDirectory(dirPath: string, lowerQuery: string, results: SearchResult[]): void {
  if (!existsSync(dirPath)) {
    return;
  }

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      // Skip hidden directories and skip dirs
      if (entry.startsWith(".") || SKIP_DIRS.includes(entry)) {
        continue;
      }

      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        searchInDirectory(fullPath, lowerQuery, results);
      } else if (stat.isFile()) {
        // Check file extension
        const ext = entry.substring(entry.lastIndexOf("."));
        if (!SEARCH_EXTENSIONS.includes(ext)) {
          continue;
        }

        try {
          const content = readFileSync(fullPath, "utf-8");
          const lowerContent = content.toLowerCase();
          const lines = content.split("\n");
          const lowerLines = lowerContent.split("\n");

          for (let i = 0; i < lines.length; i++) {
            // Case-insensitive search using pre-lowercased content
            if (lowerLines[i].includes(lowerQuery)) {
              const lineNum = i + 1;
              const contextStart = Math.max(0, i - 1);
              const contextEnd = Math.min(lines.length - 1, i + 1);
              const context = lines.slice(contextStart, contextEnd + 1).join("\n");
              const lowerContext = lowerLines.slice(contextStart, contextEnd + 1).join("\n");

              results.push({
                skill: basename(dirPath),
                file: entry,
                line: lineNum,
                content: context,
                lowerContent: lowerContext,
              });
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }
  } catch {
    // Skip directories that can't be read
  }
}

/**
 * Find skills by query (always searches global ~/.agents/skills)
 */
export async function findSkills(query: string): Promise<void> {
  if (!query || query.trim() === "") {
    console.log(pc.yellow("Please provide a search query."));
    console.log(pc.gray("Usage: bd-skills find <query>"));
    return;
  }

  const skillsDir = getGlobalSkillsDir();
  const lowerQuery = query.toLowerCase(); // Cache for efficiency

  console.log(pc.cyan(`Searching for "${query}" in global skills...\n`));

  if (!existsSync(skillsDir)) {
    console.log(pc.yellow(`No global skills directory found at: ${skillsDir}`));
    console.log(pc.gray(`Use 'bd-skills add <source>' to add skills.`));
    return;
  }

  const results: SearchResult[] = [];
  searchInDirectory(skillsDir, lowerQuery, results);

  if (results.length === 0) {
    console.log(pc.yellow(`No matches found for "${query}" in global skills.`));
    return;
  }

  // Group results by skill
  const groupedBySkill = new Map<string, SearchResult[]>();
  for (const result of results) {
    const existing = groupedBySkill.get(result.skill) || [];
    existing.push(result);
    groupedBySkill.set(result.skill, existing);
  }

  // Display results
  console.log(pc.green(`Found ${results.length} match(es) in ${groupedBySkill.size} skill(s):\n`));

  for (const [skill, skillResults] of groupedBySkill) {
    console.log(pc.underline(pc.white(`=== ${skill} ===`)));

    // Show unique files for this skill
    const filesWithMatches = new Map<string, SearchResult[]>();
    for (const result of skillResults) {
      const existing = filesWithMatches.get(result.file) || [];
      existing.push(result);
      filesWithMatches.set(result.file, existing);
    }

    for (const [, fileResults] of filesWithMatches) {
      console.log(pc.gray(`  ${fileResults[0].file}:`));
      for (const result of fileResults) {
        const lines = result.content.split("\n");
        const lowerLines = result.lowerContent.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed) {
            // Use pre-lowercased content to avoid repeated toLowerCase
            const isMatch = lowerLines[i].includes(lowerQuery);
            if (isMatch) {
              console.log(pc.white(`    ${pc.gray(">")} ${lines[i]}`));
            } else {
              console.log(pc.gray(`    ${lines[i]}`));
            }
          }
        }
      }
    }
    console.log();
  }

  console.log(pc.gray(`Searched in: ${skillsDir}`));
}
