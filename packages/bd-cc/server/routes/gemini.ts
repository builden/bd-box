import express from 'express';
import sessionManager from '../sessionManager.ts';
import { sessionNamesDb } from '../database/index.ts';
import { getGeminiCliSessionMessages } from '../project-service.ts';
import { createLogger } from '../utils/logger';
import { success, badRequest, serverError } from '../utils/api-response.js';

const router = express.Router();
const logger = createLogger('gemini-routes');

router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== 'string' || !/^[a-zA-Z0-9_.-]{1,100}$/.test(sessionId)) {
      return badRequest(res, 'Invalid session ID format');
    }

    let messages = sessionManager.getSessionMessages(sessionId);

    // Fallback to Gemini CLI sessions on disk
    if (messages.length === 0) {
      messages = await getGeminiCliSessionMessages(sessionId);
    }

    const result = {
      messages: {
        messages,
        meta: {
          total: messages.length,
          hasMore: false,
          offset: 0,
        },
      },
    };

    // 遵循 api.md 规范: 使用 success() 包装响应
    return success(res, result);
  } catch (error) {
    logger.error('Error fetching Gemini session messages:', error);
    return serverError(res, error instanceof Error ? error.message : String(error));
  }
});

router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== 'string' || !/^[a-zA-Z0-9_.-]{1,100}$/.test(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session ID format' });
    }

    await sessionManager.deleteSession(sessionId);
    sessionNamesDb.deleteName(sessionId, 'gemini');
    res.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting Gemini session ${req.params.sessionId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
