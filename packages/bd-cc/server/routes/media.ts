/**
 * Media Routes
 * Transcribe, upload images, token usage endpoints
 */

import { Router } from 'express';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../lib/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const logger = createLogger('routes/media');
const router = Router();

// ============================================================================
// Transcribe (Speech to Text)
// ============================================================================

router.post('/api/transcribe', authenticateToken, async (req, res) => {
  try {
    const multer = (await import('multer')).default;
    const upload = multer({ storage: multer.memoryStorage() });

    upload.single('audio')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Failed to process audio file' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in server environment.' });
      }

      try {
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'json');
        formData.append('language', 'en');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Whisper API error: ${response.status}`);
        }

        const data = await response.json();
        let transcribedText = data.text || '';

        const mode = req.body.mode || 'default';

        if (!transcribedText) {
          return res.json({ text: '', mode });
        }

        if (mode === 'enhance' || mode === 'translate') {
          try {
            const language = mode === 'translate' ? 'Chinese' : 'English';
            const enhanceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: `You are a transcription assistant. ${
                      mode === 'translate'
                        ? `Translate the following ${language} transcription to Chinese.`
                        : `Improve and correct the following transcription.`
                    } Only respond with the processed text, no explanations.`,
                  },
                  { role: 'user', content: transcribedText },
                ],
                temperature: 0,
              }),
            });

            if (enhanceResponse.ok) {
              const enhanceData = await enhanceResponse.json();
              transcribedText = enhanceData.choices[0]?.message?.content || transcribedText;
            }
          } catch (enhanceError) {
            logger.error('Error enhancing transcription:', enhanceError);
          }
        }

        res.json({ text: transcribedText, mode });
      } catch (error: any) {
        logger.error('Transcription error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error: any) {
    logger.error('Error in transcribe endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Upload Images
// ============================================================================

router.post('/api/projects/:projectName/upload-images', authenticateToken, async (req, res) => {
  try {
    const multer = (await import('multer')).default;
    const pathModule = (await import('path')).default;
    const fsPromises = (await import('fs')).promises;
    const osModule = (await import('os')).default;

    const storage = multer.diskStorage({
      destination: async (req: any, file: any, cb: any) => {
        const uploadDir = pathModule.join(osModule.tmpdir(), 'claude-ui-uploads', String(req.user?.id));
        await fsPromises.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedName);
      },
    });

    const fileFilter = (req: any, file: any, cb: any) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.'));
      }
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
      },
    });

    upload.array('images', 5)(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      try {
        const processedImages = await Promise.all(
          (req.files as any[]).map(async (file: any) => {
            const buffer = await fsPromises.readFile(file.path);
            const base64 = buffer.toString('base64');
            const mimeType = file.mimetype;

            await fsPromises.unlink(file.path);

            return {
              name: file.originalname,
              data: `data:${mimeType};base64,${base64}`,
              size: file.size,
              mimeType: mimeType,
            };
          })
        );

        res.json({ images: processedImages });
      } catch (error: any) {
        logger.error('Error processing images:', error);
        await Promise.all((req.files as any[]).map((f: any) => fsPromises.unlink(f.path).catch(() => {})));
        res.status(500).json({ error: 'Failed to process images' });
      }
    });
  } catch (error: any) {
    logger.error('Error in image upload endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Token Usage
// ============================================================================

router.get('/api/projects/:projectName/sessions/:sessionId/token-usage', authenticateToken, async (req, res) => {
  try {
    const { projectName, sessionId } = req.params;
    const { provider = 'claude' } = req.query;
    const homeDir = os.homedir();

    const safeSessionId = String(sessionId).replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeSessionId || safeSessionId !== String(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    // Cursor sessions - no token tracking
    if (provider === 'cursor') {
      return res.json({
        used: 0,
        total: 0,
        breakdown: { input: 0, cacheCreation: 0, cacheRead: 0 },
        unsupported: true,
        message: 'Token usage tracking not available for Cursor sessions',
      });
    }

    // Gemini sessions - no token tracking
    if (provider === 'gemini') {
      return res.json({
        used: 0,
        total: 0,
        breakdown: { input: 0, cacheCreation: 0, cacheRead: 0 },
        unsupported: true,
        message: 'Token usage tracking not available for Gemini sessions',
      });
    }

    // Codex sessions
    if (provider === 'codex') {
      const codexSessionsDir = path.join(homeDir, '.codex', 'sessions');

      const findSessionFile = async (dir: string): Promise<string | null> => {
        try {
          const entries = await fs.promises.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              const found = await findSessionFile(fullPath);
              if (found) return found;
            } else if (entry.name.includes(safeSessionId) && entry.name.endsWith('.jsonl')) {
              return fullPath;
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
        return null;
      };

      const sessionFilePath = await findSessionFile(codexSessionsDir);

      if (!sessionFilePath) {
        return res.json({
          used: 0,
          total: 0,
          breakdown: { input: 0, cacheCreation: 0, cacheRead: 0 },
          message: 'Session file not found',
        });
      }

      try {
        const content = await fs.promises.readFile(sessionFilePath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());

        let totalTokens = 0;
        let inputTokens = 0;
        let outputTokens = 0;

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.usage) {
              totalTokens += data.usage.total_tokens || 0;
              inputTokens += data.usage.prompt_tokens || 0;
              outputTokens += data.usage.completion_tokens || 0;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }

        res.json({
          used: totalTokens,
          total: 0,
          breakdown: { input: inputTokens, cacheCreation: 0, cacheRead: outputTokens },
        });
      } catch (error: any) {
        logger.error('Error reading Codex session file:', error);
        res.status(500).json({ error: error.message });
      }
      return;
    }

    // Claude sessions (default)
    const claudeProjectsDir = path.join(homeDir, '.claude', 'projects');
    let sessionFilePath: string | null = null;

    const findInDir = async (dir: string): Promise<string | null> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const found = await findInDir(path.join(dir, entry.name));
            if (found) return found;
          } else if (entry.name.startsWith(safeSessionId) && entry.name.endsWith('.json')) {
            return path.join(dir, entry.name);
          }
        }
      } catch {
        // Skip inaccessible directories
      }
      return null;
    };

    sessionFilePath = await findInDir(claudeProjectsDir);

    if (!sessionFilePath) {
      return res.json({
        used: 0,
        total: 0,
        breakdown: { input: 0, cacheCreation: 0, cacheRead: 0 },
        message: 'Session file not found',
      });
    }

    const content = await fs.promises.readFile(sessionFilePath, 'utf-8');
    const data = JSON.parse(content);

    const usage = data.session?.usage || {};
    const totalTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);

    res.json({
      used: totalTokens,
      total: 0,
      breakdown: {
        input: usage.input_tokens || 0,
        cacheCreation: usage.cache_creation_input_tokens || 0,
        cacheRead: usage.cache_read_input_tokens || 0,
      },
    });
  } catch (error: any) {
    logger.error('Error getting token usage:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
