/**
 * Commands Route Utilities
 * Helper functions and built-in commands for the commands API
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('routes/commands/utils');

/**
 * Recursively scan directory for command files (.md)
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @param {string} namespace - Namespace for commands (e.g., 'project', 'user')
 * @returns {Promise<Array>} Array of command objects
 */
export async function scanCommandsDirectory(dir: string, baseDir: string, namespace: string): Promise<any[]> {
  const commands = [];

  try {
    // Check if directory exists
    await fs.access(dir);

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subCommands = await scanCommandsDirectory(fullPath, baseDir, namespace);
        commands.push(...subCommands);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Parse markdown file for metadata
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const { data: frontmatter, content: commandContent } = matter(content);

          // Calculate relative path from baseDir for command name
          const relativePath = path.relative(baseDir, fullPath);
          // Remove .md extension and convert to command name
          const commandName = '/' + relativePath.replace(/\.md$/, '').replace(/\\/g, '/');

          // Extract description from frontmatter or first line of content
          let description = '';
          if (frontmatter.description) {
            description = frontmatter.description;
          } else {
            // Get first non-empty line that's not a frontmatter delimiter
            const lines = commandContent.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('---')) {
                description = trimmed.slice(0, 200);
                break;
              }
            }
          }

          // Get command content (strip frontmatter if present)
          const commandBody = commandContent.replace(/^---[\s\S]*?---\n/, '').trim();

          commands.push({
            name: commandName,
            description,
            content: commandBody,
            path: fullPath,
            namespace,
            ...frontmatter,
          });
        } catch (parseError) {
          logger.warn('Failed to parse command file:', fullPath, parseError);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or is not accessible - that's OK for optional directories
    logger.debug('Commands directory not accessible:', dir, error);
  }

  return commands;
}

/**
 * Built-in commands that come with Claude Code UI
 */
export const builtInCommands = [
  {
    name: '/test',
    description: 'Run test suite with coverage',
    content: `bun test{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'testing',
  },
  {
    name: '/build',
    description: 'Build the project',
    content: `bun run build{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'build',
  },
  {
    name: '/lint',
    description: 'Run linter',
    content: `bun run lint{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'lint',
  },
  {
    name: '/typecheck',
    description: 'Run TypeScript type checking',
    content: `bun run typecheck{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'typecheck',
  },
  {
    name: '/commit',
    description: 'Create a git commit with staged changes',
    content: `git commit -m "{{#if args}}{{args}}{{else}}Update{{/if}}"`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/push',
    description: 'Push changes to remote',
    content: `git push{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/pull',
    description: 'Pull changes from remote',
    content: `git pull{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/status',
    description: 'Show git status',
    content: `git status{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/log',
    description: 'Show git commit log',
    content: `git log --oneline -n 20{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/diff',
    description: 'Show git diff',
    content: `git diff{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/new',
    description: 'Create a new branch and switch to it',
    content: `git checkout -b "{{#if args}}{{args}}{{else}}feature/{{/if}}"`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/switch',
    description: 'Switch to an existing branch',
    content: `git checkout "{{#if args}}{{args}}{{/if}}"`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/merge',
    description: 'Merge a branch into current branch',
    content: `git merge "{{#if args}}{{args}}{{/if}}"`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/rebase',
    description: 'Rebase current branch onto another',
    content: `git rebase "{{#if args}}{{args}}{{/if}}"`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/stash',
    description: 'Stash current changes',
    content: `git stash{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/unstash',
    description: 'Apply stashed changes',
    content: `git stash pop{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/install',
    description: 'Install dependencies',
    content: `bun install{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'package',
  },
  {
    name: '/add',
    description: 'Add files to git',
    content: `git add "{{#if args}}{{args}}{{else}}.{{/if}}"`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/reset',
    description: 'Reset git state',
    content: `git reset{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/clean',
    description: 'Clean untracked files',
    content: `git clean -fd{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/fetch',
    description: 'Fetch from remote',
    content: `git fetch{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/branch',
    description: 'List or delete branches',
    content: `git branch{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/tag',
    description: 'List or create tags',
    content: `git tag{{#if args}} {{args}}{{/if}}`,
    namespace: 'builtin',
    category: 'git',
  },
  {
    name: '/rewind',
    description: 'Rewind the conversation by N steps',
    content: `# Rewind conversation by {{#if args}}{{args}}{{else}}1{{/if}} step(s)
# This is a special command that rewinds the conversation history
# It's useful when you want to go back and try a different approach
{{ steps: {{#if args}}{{args}}{{else}}1{{/if}} }}`,
    namespace: 'builtin',
    category: 'conversation',
    hidden: true,
  },
];

/**
 * Replace template variables in command content
 * @param {string} content - Command template content
 * @param {object} args - Arguments to replace
 * @param {object} context - Context variables (projectPath, etc.)
 * @returns {string} Processed command
 */
export function processCommandTemplate(content: string, args: string[] = [], context: any = {}): string {
  let result = content;

  // Replace {{args}} with provided arguments
  if (args.length > 0) {
    result = result.replace(/\{\{args\}\}/g, args.join(' '));
  } else {
    result = result.replace(/\{\{args\}\}/g, '');
  }

  // Replace {{#if args}} blocks
  result = result.replace(/\{\{#if args\}\}([\s\S]*?)\{\{\/if\}\}/g, args.length > 0 ? '$1' : '');

  // Replace context variables
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }

  return result.trim();
}
