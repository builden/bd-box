import jwt from 'jsonwebtoken';
import { userDb, appConfigDb } from '../database/index.ts';
import { IS_PLATFORM } from '../env.ts';

// Use env var if set, otherwise auto-generate a unique secret per installation
const JWT_SECRET = process.env.JWT_SECRET || appConfigDb.getOrCreateJwtSecret();

// Optional API key middleware
const validateApiKey = (req, res, next) => {
  // Skip API key validation if not configured
  if (!process.env.API_KEY) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  // 本地应用模式：跳过 JWT 验证，使用默认本地用户
  // 类似 IS_PLATFORM 模式，但不需要查询数据库
  if (!IS_PLATFORM) {
    req.user = { id: 'local-user', username: 'local' };
    return next();
  }

  // Platform mode: use single database user
  try {
    const user = userDb.getFirstUser();
    if (!user) {
      return res.status(500).json({ error: 'Platform mode: No user found in database' });
    }
    req.user = user;
    return next();
  } catch (error) {
    console.error('Platform mode error:', error);
    return res.status(500).json({ error: 'Platform mode: Failed to fetch user' });
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// WebSocket authentication function
const authenticateWebSocket = (token) => {
  // 本地应用模式：跳过 JWT 验证，返回默认本地用户
  if (!IS_PLATFORM) {
    return { userId: 'local-user', username: 'local' };
  }

  // Platform mode: bypass token validation, return first user
  try {
    const user = userDb.getFirstUser();
    if (user) {
      return { userId: user.id, username: user.username };
    }
    return null;
  } catch (error) {
    console.error('Platform mode WebSocket error:', error);
    return null;
  }
};

export { validateApiKey, authenticateToken, generateToken, authenticateWebSocket, JWT_SECRET };
