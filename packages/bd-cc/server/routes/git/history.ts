/**
 * Git History Routes
 * Endpoints for commit history and messages
 */

import { Router } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import {
  validateCommitRef,
  getGitErrorDetails,
  getRepositoryRootPath,
  resolveRepositoryFilePath,
  cleanCommitMessage,
} from '../../utils/git';
import { queryClaudeSDK } from '../../providers/claude.ts';
import { spawnCursor } from '../../providers/cursor.ts';
import { getActualProjectPath, validateGitRepository, spawnAsync } from './utils';

const router = Router();

// Commits
router.get('/commits', async (req, res) => {
  const { project, limit = 10 } = req.query;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    await validateGitRepository(projectPath);

    const parsedLimit = Number.parseInt(String(limit), 10);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;

    const { stdout } = await spawnAsync(
      'git',
      ['log', '--pretty=format:%H|%an|%ae|%ad|%s', '--date=relative', '-n', String(safeLimit)],
      { cwd: projectPath }
    );

    const commits = stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, author, email, date, ...messageParts] = line.split('|');
        return { hash, author, email, date, message: messageParts.join('|') };
      });

    res.json({ commits });
  } catch (error) {
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// Commit diff
router.get('/commit-diff', async (req, res) => {
  const { project, commit } = req.query;

  if (!project || !commit) {
    return res.status(400).json({ error: 'Project name and commit hash are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    validateCommitRef(commit);

    const { stdout } = await spawnAsync('git', ['show', commit], { cwd: projectPath });

    const isTruncated = stdout.length > 500_000;
    res.json({ diff: isTruncated ? stdout.slice(0, 500_000) + '\n... (truncated)' : stdout, isTruncated });
  } catch (error) {
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// Generate commit message
router.post('/generate-commit-message', async (req, res) => {
  const { project, files, provider = 'claude' } = req.body;

  if (!project || !files || files.length === 0) {
    return res.status(400).json({ error: 'Project name and files are required' });
  }

  if (!['claude', 'cursor'].includes(provider)) {
    return res.status(400).json({ error: 'provider must be "claude" or "cursor"' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);
    const repositoryRootPath = await getRepositoryRootPath(projectPath);

    let diffContext = '';
    for (const file of files) {
      try {
        const resolved = await resolveRepositoryFilePath(projectPath, file);
        if (!resolved) continue;
        const { repositoryRelativeFilePath } = resolved;
        const { stdout } = await spawnAsync('git', ['diff', 'HEAD', '--', repositoryRelativeFilePath], {
          cwd: repositoryRootPath,
        });
        if (stdout) diffContext += `\n--- ${repositoryRelativeFilePath} ---\n${stdout}`;
      } catch {}
    }

    if (!diffContext.trim()) {
      for (const file of files) {
        try {
          const resolved = await resolveRepositoryFilePath(projectPath, file);
          if (!resolved) continue;
          const { repositoryRelativeFilePath } = resolved;
          const filePath = path.join(repositoryRootPath, repositoryRelativeFilePath);
          const stats = await fs.stat(filePath);
          if (!stats.isDirectory()) {
            const content = await fs.readFile(filePath, 'utf-8');
            diffContext += `\n--- ${repositoryRelativeFilePath} (new file) ---\n${content.substring(0, 1000)}\n`;
          }
        } catch {}
      }
    }

    const message = await generateCommitMessageWithAI(files, diffContext, provider, projectPath);
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

async function generateCommitMessageWithAI(
  files: string[],
  diffContext: string,
  provider: string,
  projectPath: string
): Promise<string> {
  const prompt = `Generate a conventional commit message for these changes.

REQUIREMENTS:
- Format: type(scope): subject
- Include body explaining what changed and why
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Subject under 50 chars, body wrapped at 72 chars
- Focus on user-facing changes, not implementation details
- Return ONLY the commit message (no markdown, explanations, or code blocks)

FILES CHANGED:
${files.map((f) => `- ${f}`).join('\n')}

DIFFS:
${diffContext.substring(0, 4000)}

Generate the commit message:`;

  try {
    let responseText = '';
    const writer = {
      send: (data: any) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (parsed.type === 'claude-response' && parsed.data) {
            const message = parsed.data.message || parsed.data;
            if (message.content && Array.isArray(message.content)) {
              for (const item of message.content) {
                if (item.type === 'text' && item.text) responseText += item.text;
              }
            }
          } else if (parsed.type === 'cursor-output' && parsed.output) {
            responseText += parsed.output;
          } else if (parsed.type === 'text' && parsed.text) {
            responseText += parsed.text;
          }
        } catch {}
      },
      setSessionId: () => {},
    };

    if (provider === 'claude') {
      await queryClaudeSDK(prompt, { cwd: projectPath, permissionMode: 'bypassPermissions', model: 'sonnet' }, writer);
    } else if (provider === 'cursor') {
      await spawnCursor(prompt, { cwd: projectPath, skipPermissions: true }, writer);
    }

    return cleanCommitMessage(responseText) || `chore: update ${files.length} file${files.length !== 1 ? 's' : ''}`;
  } catch {
    return `chore: update ${files.length} file${files.length !== 1 ? 's' : ''}`;
  }
}

export default router;
