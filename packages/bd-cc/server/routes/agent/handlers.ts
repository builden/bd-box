/**
 * Agent Route Handlers
 * Main request handlers for the agent API route
 */

import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { githubTokensDb } from '../../database/index.ts';
import { addProjectManually } from '../../project-service.ts';
import { queryClaudeSDK } from '../../providers/claude.ts';
import { spawnCursor } from '../../providers/cursor.ts';
import { queryCodex } from '../../providers/codex.ts';
import { spawnGemini } from '../../providers/gemini.ts';
import { CODEX_MODELS } from '../../../shared/modelConstants.ts';
import { createLogger } from '../../lib/logger.ts';
import {
  normalizeGitHubUrl,
  parseGitHubUrl,
  autogenerateBranchName,
  validateBranchName,
  getGitRemoteUrl,
  getCommitMessages,
  createGitHubBranch,
  createGitHubPR,
  cloneGitHubRepo,
  cleanupProject,
  SSEStreamWriter,
  ResponseCollector,
} from './utils.ts';

const logger = createLogger('routes/agent/handlers');

const router = Router();

/**
 * POST /api/agent
 *
 * Trigger an AI agent (Claude or Cursor) to work on a project.
 * Supports automatic GitHub branch and pull request creation after successful completion.
 */
router.post('/', async (req: Request, res: Response) => {
  const { githubUrl, projectPath, message, provider = 'claude', model, githubToken, branchName } = req.body;

  // Parse stream and cleanup as booleans (handle string "true"/"false" from curl)
  const stream = req.body.stream === undefined ? true : req.body.stream === true || req.body.stream === 'true';
  const cleanup = req.body.cleanup === undefined ? true : req.body.cleanup === true || req.body.cleanup === 'true';

  // If branchName is provided, automatically enable createBranch
  const createBranch = branchName ? true : req.body.createBranch === true || req.body.createBranch === 'true';
  const createPR = req.body.createPR === true || req.body.createPR === 'true';

  // Validate inputs
  if (!githubUrl && !projectPath) {
    return res.status(400).json({ error: 'Either githubUrl or projectPath is required' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!['claude', 'cursor', 'codex', 'gemini'].includes(provider)) {
    return res.status(400).json({ error: 'provider must be "claude", "cursor", "codex", or "gemini"' });
  }

  // Validate GitHub branch/PR creation requirements
  // Allow branch/PR creation with projectPath as long as it has a GitHub remote
  if ((createBranch || createPR) && !githubUrl && !projectPath) {
    return res
      .status(400)
      .json({ error: 'createBranch and createPR require either githubUrl or projectPath with a GitHub remote' });
  }

  let finalProjectPath: string | null = null;
  let writer: SSEStreamWriter | ResponseCollector | null = null;

  try {
    // Determine the final project path
    if (githubUrl) {
      // Clone repository (to projectPath if provided, otherwise generate path)
      const tokenToUse = githubToken || githubTokensDb.getActiveGithubToken(req.user?.id);

      let targetPath: string;
      if (projectPath) {
        targetPath = projectPath;
      } else {
        // Generate a unique path for cloning
        const repoHash = crypto
          .createHash('md5')
          .update(githubUrl + Date.now())
          .digest('hex');
        targetPath = path.join(os.homedir(), '.claude', 'external-projects', repoHash);
      }

      finalProjectPath = await cloneGitHubRepo(githubUrl.trim(), tokenToUse, targetPath);
    } else {
      // Use existing project path
      finalProjectPath = path.resolve(projectPath);

      // Verify the path exists
      try {
        await fs.access(finalProjectPath);
      } catch (error) {
        throw new Error(`Project path does not exist: ${finalProjectPath}`);
      }
    }

    // Register the project (or use existing registration)
    let project;
    try {
      project = await addProjectManually(finalProjectPath);
      logger.info('Project registered:', { project });
    } catch (error: any) {
      // If project already exists, that's fine - continue with the existing registration
      if (error.message && error.message.includes('Project already configured')) {
        logger.info('Using existing project registration for:', { finalProjectPath });
        project = { path: finalProjectPath };
      } else {
        throw error;
      }
    }

    // Set up writer based on streaming mode
    if (stream) {
      // Set up SSE headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      writer = new SSEStreamWriter(res);

      // Send initial status
      writer.send({
        type: 'status',
        message: githubUrl ? 'Repository cloned and session started' : 'Session started',
        projectPath: finalProjectPath,
      });
    } else {
      // Non-streaming mode: collect messages
      writer = new ResponseCollector();

      // Collect initial status message
      writer.send({
        type: 'status',
        message: githubUrl ? 'Repository cloned and session started' : 'Session started',
        projectPath: finalProjectPath,
      });
    }

    // Start the appropriate session
    if (provider === 'claude') {
      logger.info('Starting Claude SDK session');

      await queryClaudeSDK(
        message.trim(),
        {
          projectPath: finalProjectPath,
          cwd: finalProjectPath,
          sessionId: null, // New session
          model: model,
          permissionMode: 'bypassPermissions', // Bypass all permissions for API calls
        },
        writer
      );
    } else if (provider === 'cursor') {
      logger.info('Starting Cursor CLI session');

      await spawnCursor(
        message.trim(),
        {
          projectPath: finalProjectPath,
          cwd: finalProjectPath,
          sessionId: null, // New session
          model: model || undefined,
          skipPermissions: true, // Bypass permissions for Cursor
        },
        writer
      );
    } else if (provider === 'codex') {
      logger.info('Starting Codex SDK session');

      await queryCodex(
        message.trim(),
        {
          projectPath: finalProjectPath,
          cwd: finalProjectPath,
          sessionId: null,
          model: model || CODEX_MODELS.DEFAULT,
          permissionMode: 'bypassPermissions',
        },
        writer
      );
    } else if (provider === 'gemini') {
      logger.info('Starting Gemini CLI session');

      await spawnGemini(
        message.trim(),
        {
          projectPath: finalProjectPath,
          cwd: finalProjectPath,
          sessionId: null,
          model: model,
          skipPermissions: true, // CLI mode bypasses permissions
        },
        writer
      );
    }

    // Handle GitHub branch and PR creation after successful agent completion
    let branchInfo: any = null;
    let prInfo: any = null;

    if (createBranch || createPR) {
      try {
        logger.info('Starting GitHub branch/PR creation workflow...');

        // Get GitHub token
        const tokenToUse = githubToken || githubTokensDb.getActiveGithubToken(req.user?.id);

        if (!tokenToUse) {
          throw new Error('GitHub token required for branch/PR creation. Please configure a GitHub token in settings.');
        }

        // Import Octokit here to avoid top-level issues
        const { Octokit } = await import('@octokit/rest');
        const octokit = new Octokit({ auth: tokenToUse });

        // Get GitHub URL - either from parameter or from git remote
        let repoUrl = githubUrl;
        if (!repoUrl) {
          logger.info('Getting GitHub URL from git remote...');
          try {
            repoUrl = await getGitRemoteUrl(finalProjectPath);
            if (!repoUrl.includes('github.com')) {
              throw new Error('Project does not have a GitHub remote configured');
            }
            logger.info(`Found GitHub remote: ${repoUrl}`);
          } catch (error: any) {
            throw new Error(`Failed to get GitHub remote URL: ${error.message}`);
          }
        }

        // Parse GitHub URL to get owner and repo
        const { owner, repo } = parseGitHubUrl(repoUrl);
        logger.info(`Repository: ${owner}/${repo}`);

        // Use provided branch name or auto-generate from message
        const finalBranchName = branchName || autogenerateBranchName(message);
        if (branchName) {
          logger.info(`Using provided branch name: ${finalBranchName}`);

          // Validate custom branch name
          const validation = validateBranchName(finalBranchName);
          if (!validation.valid) {
            throw new Error(`Invalid branch name: ${validation.error}`);
          }
        } else {
          logger.info(`Auto-generated branch name: ${finalBranchName}`);
        }

        if (createBranch) {
          // Create and checkout the new branch locally
          logger.info('Creating local branch...');
          const checkoutProcess = spawn('git', ['checkout', '-b', finalBranchName], {
            cwd: finalProjectPath,
            stdio: 'pipe',
          });

          await new Promise((resolve, reject) => {
            let stderr = '';
            checkoutProcess.stderr.on('data', (data) => {
              stderr += data.toString();
            });
            checkoutProcess.on('close', (code) => {
              if (code === 0) {
                logger.info(`Created and checked out local branch '${finalBranchName}'`);
                resolve();
              } else {
                // Branch might already exist locally, try to checkout
                if (stderr.includes('already exists')) {
                  logger.info(`Branch '${finalBranchName}' already exists locally, checking out...`);
                  const checkoutExisting = spawn('git', ['checkout', finalBranchName], {
                    cwd: finalProjectPath,
                    stdio: 'pipe',
                  });
                  checkoutExisting.on('close', (checkoutCode) => {
                    if (checkoutCode === 0) {
                      logger.info(`Checked out existing branch '${finalBranchName}'`);
                      resolve();
                    } else {
                      reject(new Error(`Failed to checkout existing branch: ${stderr}`));
                    }
                  });
                } else {
                  reject(new Error(`Failed to create branch: ${stderr}`));
                }
              }
            });
          });

          // Push the branch to remote
          logger.info('Pushing branch to remote...');
          const pushProcess = spawn('git', ['push', '-u', 'origin', finalBranchName], {
            cwd: finalProjectPath,
            stdio: 'pipe',
          });

          await new Promise((resolve, reject) => {
            let stderr = '';
            let stdout = '';
            pushProcess.stdout.on('data', (data) => {
              stdout += data.toString();
            });
            pushProcess.stderr.on('data', (data) => {
              stderr += data.toString();
            });
            pushProcess.on('close', (code) => {
              if (code === 0) {
                logger.info(`Pushed branch '${finalBranchName}' to remote`);
                resolve();
              } else {
                // Check if branch exists on remote but has different commits
                if (stderr.includes('already exists') || stderr.includes('up-to-date')) {
                  logger.info(`Branch '${finalBranchName}' already exists on remote, using existing branch`);
                  resolve();
                } else {
                  reject(new Error(`Failed to push branch: ${stderr}`));
                }
              }
            });
          });

          branchInfo = {
            name: finalBranchName,
            url: `https://github.com/${owner}/${repo}/tree/${finalBranchName}`,
          };
        }

        if (createPR) {
          // Get commit messages to generate PR description
          logger.info('Generating PR title and description...');
          const commitMessages = await getCommitMessages(finalProjectPath, 5);

          // Use the first commit message as the PR title, or fallback to the agent message
          const prTitle = commitMessages.length > 0 ? commitMessages[0] : message;

          // Generate PR body from commit messages
          let prBody = '## Changes\n\n';
          if (commitMessages.length > 0) {
            prBody += commitMessages.map((msg) => `- ${msg}`).join('\n');
          } else {
            prBody += `Agent task: ${message}`;
          }
          prBody += '\n\n---\n*This pull request was automatically created by Claude Code UI Agent.*';

          logger.info(`PR Title: ${prTitle}`);

          // Create the pull request
          logger.info('Creating pull request...');
          prInfo = await createGitHubPR(octokit, owner, repo, finalBranchName, prTitle, prBody, 'main');
        }

        // Send branch/PR info in response
        if (stream && writer instanceof SSEStreamWriter) {
          if (branchInfo) {
            writer.send({
              type: 'github-branch',
              branch: branchInfo,
            });
          }
          if (prInfo) {
            writer.send({
              type: 'github-pr',
              pullRequest: prInfo,
            });
          }
        }
      } catch (error: any) {
        logger.error('GitHub branch/PR creation error:', error);

        // Send error but don't fail the entire request
        if (stream && writer instanceof SSEStreamWriter) {
          writer.send({
            type: 'github-error',
            error: error.message,
          });
        }
        // Store error info for non-streaming response
        if (!stream) {
          branchInfo = { error: error.message };
          prInfo = { error: error.message };
        }
      }
    }

    // Handle response based on streaming mode
    if (stream) {
      // Streaming mode: end the SSE stream
      if (writer instanceof SSEStreamWriter) {
        writer.end();
      }
    } else {
      // Non-streaming mode: send filtered messages and token summary as JSON
      const assistantMessages = writer.getAssistantMessages();
      const tokenSummary = writer.getTotalTokens();

      const response: any = {
        success: true,
        sessionId: writer.getSessionId(),
        messages: assistantMessages,
        tokens: tokenSummary,
        projectPath: finalProjectPath,
      };

      // Add branch/PR info if created
      if (branchInfo) {
        response.branch = branchInfo;
      }
      if (prInfo) {
        response.pullRequest = prInfo;
      }

      res.json(response);
    }

    // Clean up if requested
    if (cleanup && githubUrl) {
      // Only cleanup if we cloned a repo (not for existing project paths)
      const sessionIdForCleanup = writer.getSessionId();
      setTimeout(() => {
        cleanupProject(finalProjectPath, sessionIdForCleanup);
      }, 5000);
    }
  } catch (error: any) {
    logger.error('External session error:', error);

    // Clean up on error
    if (finalProjectPath && cleanup && githubUrl) {
      const sessionIdForCleanup = writer ? writer.getSessionId() : null;
      cleanupProject(finalProjectPath, sessionIdForCleanup);
    }

    if (stream) {
      // For streaming, send error event and stop
      if (!writer) {
        // Set up SSE headers if not already done
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        writer = new SSEStreamWriter(res);
      }

      if (writer instanceof SSEStreamWriter && !res.writableEnded) {
        writer.send({
          type: 'error',
          error: error.message,
          message: `Failed: ${error.message}`,
        });
        writer.end();
      }
    } else if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
});

export default router;
