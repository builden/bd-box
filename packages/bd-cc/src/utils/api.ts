import { IS_PLATFORM } from '../constants/config';
import { notificationService } from '../components/app/GlobalNotifications';

interface FetchOptions extends RequestInit {
  body?: BodyInit | null;
  /** 跳过默认错误通知 */
  skipErrorNotification?: boolean;
}

/**
 * API 响应拦截器
 *
 * 遵循 api.md 规范:
 * - 成功响应: { data: ... }
 * - 错误响应: { error: { code, message, details, ... } }
 *
 * 此函数自动展开 data 字段，使前端可以直接访问 response.data
 */
async function processResponse(response: Response, url: string, skipErrorNotification?: boolean): Promise<Response> {
  const refreshedToken = response.headers.get('X-Refreshed-Token');
  if (refreshedToken) {
    localStorage.setItem('auth-token', refreshedToken);
  }

  // API 错误处理 - 显示全局通知
  if (!response.ok && !skipErrorNotification) {
    const statusText = response.statusText || 'Request failed';
    const path = new URL(url, window.location.origin).pathname;
    const title = `API 错误: ${response.status}`;
    const message = `${path} - ${statusText}`;

    // 尝试解析错误消息 (RFC 7807 格式)
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.clone().json();
        // 优先使用 RFC 7807 格式
        if (errorData.error) {
          const errorMsg = errorData.error.message || errorData.error.code || message;
          notificationService.error(title, errorMsg, {
            url: path,
            status: response.status,
            context: { originalUrl: url, error: errorData.error },
          });
        } else {
          notificationService.error(title, errorData.error || errorData.message || message, {
            url: path,
            status: response.status,
            context: { originalUrl: url },
          });
        }
      } else {
        notificationService.error(title, message, {
          url: path,
          status: response.status,
        });
      }
    } catch {
      notificationService.error(title, message, {
        url: path,
        status: response.status,
      });
    }
  }

  // 成功响应: 展开 data 字段 (遵循 api.md 规范)
  if (response.ok) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonData = await response.clone().json();
        // 如果响应有 data 字段，创建新响应展开它
        if (jsonData && typeof jsonData === 'object' && 'data' in jsonData) {
          const { data, meta, ...rest } = jsonData;
          // 返回一个新的 Response，包含展开的 data
          const newBody = JSON.stringify({ data, meta, ...rest });
          const newResponse = new Response(newBody, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
          return newResponse;
        }
      }
    } catch {
      // 如果解析失败，返回原始响应
    }
  }

  return response;
}

// Utility function for authenticated API calls
export const authenticatedFetch = (url: string, options: FetchOptions = {}): Promise<Response> => {
  const { skipErrorNotification, ...fetchOptions } = options;
  const token = localStorage.getItem('auth-token');

  const defaultHeaders: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!(fetchOptions.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (!IS_PLATFORM && token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
  }).then((response) => processResponse(response, url, skipErrorNotification));
};

// API endpoints
export const api = {
  // Auth endpoints (no token required)
  auth: {
    status: () => fetch('/api/auth/status'),
    login: (username: string, password: string) =>
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string) =>
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }),
    user: () => authenticatedFetch('/api/auth/user'),
    logout: () => authenticatedFetch('/api/auth/logout', { method: 'POST' }),
  },

  // Protected endpoints
  // config endpoint removed - no longer needed (frontend uses window.location)
  projects: () => authenticatedFetch('/api/projects'),
  sessions: (projectName: string, limit = 5, offset = 0) =>
    authenticatedFetch(`/api/projects/${projectName}/sessions?limit=${limit}&offset=${offset}`),
  sessionMessages: (
    projectName: string,
    sessionId: string,
    limit: number | null = null,
    offset = 0,
    provider = 'claude'
  ) => {
    const params = new URLSearchParams();
    if (limit !== null) {
      params.append('limit', String(limit));
      params.append('offset', String(offset));
    }
    const queryString = params.toString();

    let url;
    if (provider === 'codex') {
      url = `/api/codex/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
    } else if (provider === 'cursor') {
      url = `/api/cursor/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
    } else if (provider === 'gemini') {
      url = `/api/gemini/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
    } else {
      url = `/api/projects/${projectName}/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
    }
    return authenticatedFetch(url);
  },
  renameProject: (projectName: string, displayName: string) =>
    authenticatedFetch(`/api/projects/${projectName}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ displayName }),
    }),
  deleteSession: (projectName: string, sessionId: string) =>
    authenticatedFetch(`/api/projects/${projectName}/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  renameSession: (sessionId: string, summary: string, provider: string) =>
    authenticatedFetch(`/api/sessions/${sessionId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ summary, provider }),
    }),
  deleteCodexSession: (sessionId: string) =>
    authenticatedFetch(`/api/codex/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  deleteGeminiSession: (sessionId: string) =>
    authenticatedFetch(`/api/gemini/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  deleteProject: (projectName: string, force = false) =>
    authenticatedFetch(`/api/projects/${projectName}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    }),
  searchConversationsUrl: (query: string, limit = 50) => {
    const token = localStorage.getItem('auth-token');
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (token) params.set('token', token);
    return `/api/search/conversations?${params.toString()}`;
  },
  createProject: (path: string) =>
    authenticatedFetch('/api/projects/create', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  createWorkspace: (workspaceData: unknown) =>
    authenticatedFetch('/api/projects/create-workspace', {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    }),
  readFile: (projectName: string, filePath: string) =>
    authenticatedFetch(`/api/projects/${projectName}/file?filePath=${encodeURIComponent(filePath)}`),
  saveFile: (projectName: string, filePath: string, content: string) =>
    authenticatedFetch(`/api/projects/${projectName}/file`, {
      method: 'PUT',
      body: JSON.stringify({ filePath, content }),
    }),
  getFiles: (projectName: string, options: FetchOptions = {}) =>
    authenticatedFetch(`/api/projects/${projectName}/files`, options),

  // File operations
  createFile: (projectName: string, { path, type, name }: { path: string; type: string; name: string }) =>
    authenticatedFetch(`/api/projects/${projectName}/files/create`, {
      method: 'POST',
      body: JSON.stringify({ path, type, name }),
    }),

  renameFile: (projectName: string, { oldPath, newName }: { oldPath: string; newName: string }) =>
    authenticatedFetch(`/api/projects/${projectName}/files/rename`, {
      method: 'PUT',
      body: JSON.stringify({ oldPath, newName }),
    }),

  deleteFile: (projectName: string, { path, type }: { path: string; type: string }) =>
    authenticatedFetch(`/api/projects/${projectName}/files`, {
      method: 'DELETE',
      body: JSON.stringify({ path, type }),
    }),

  uploadFiles: (projectName: string, formData: FormData) =>
    authenticatedFetch(`/api/projects/${projectName}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),

  transcribe: (formData: FormData) =>
    authenticatedFetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),

  // TaskMaster endpoints
  taskmaster: {
    // Initialize TaskMaster in a project
    init: (projectName: string) =>
      authenticatedFetch(`/api/taskmasters/init/${projectName}`, {
        method: 'POST',
      }),

    // Add a new task
    addTask: (
      projectName: string,
      {
        prompt,
        title,
        description,
        priority,
        dependencies,
      }: { prompt: string; title?: string; description?: string; priority?: string; dependencies?: string[] }
    ) =>
      authenticatedFetch(`/api/taskmasters/add-task/${projectName}`, {
        method: 'POST',
        body: JSON.stringify({ prompt, title, description, priority, dependencies }),
      }),

    // Parse PRD to generate tasks
    parsePRD: (
      projectName: string,
      { fileName, numTasks, append }: { fileName: string; numTasks?: number; append?: boolean }
    ) =>
      authenticatedFetch(`/api/taskmasters/parse-prd/${projectName}`, {
        method: 'POST',
        body: JSON.stringify({ fileName, numTasks, append }),
      }),

    // Get available PRD templates
    getTemplates: () => authenticatedFetch('/api/taskmasters/prd-templates'),

    // Apply a PRD template
    applyTemplate: (
      projectName: string,
      { templateId, fileName, customizations }: { templateId: string; fileName?: string; customizations?: unknown }
    ) =>
      authenticatedFetch(`/api/taskmasters/apply-template/${projectName}`, {
        method: 'POST',
        body: JSON.stringify({ templateId, fileName, customizations }),
      }),

    // Update a task
    updateTask: (projectName: string, taskId: string, updates: unknown) =>
      authenticatedFetch(`/api/taskmasters/update-task/${projectName}/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },

  // Browse filesystem for project suggestions
  browseFilesystem: (dirPath: string | null = null) => {
    const params = new URLSearchParams();
    if (dirPath) params.append('path', dirPath);

    return authenticatedFetch(`/api/browse-filesystem?${params}`);
  },

  createFolder: (folderPath: string) =>
    authenticatedFetch('/api/create-folder', {
      method: 'POST',
      body: JSON.stringify({ path: folderPath }),
    }),

  // User endpoints
  user: {
    gitConfig: () => authenticatedFetch('/api/users/git-config'),
    updateGitConfig: (gitName: string, gitEmail: string) =>
      authenticatedFetch('/api/users/git-config', {
        method: 'POST',
        body: JSON.stringify({ gitName, gitEmail }),
      }),
    onboardingStatus: () => authenticatedFetch('/api/users/onboarding-status'),
    completeOnboarding: () =>
      authenticatedFetch('/api/users/complete-onboarding', {
        method: 'POST',
      }),
  },

  // Generic GET method for any endpoint
  get: (endpoint: string) => authenticatedFetch(`/api${endpoint}`),

  // Generic POST method for any endpoint
  post: (endpoint: string, body: unknown) =>
    authenticatedFetch(`/api${endpoint}`, {
      method: 'POST',
      ...(body instanceof FormData ? { body } : { body: JSON.stringify(body) }),
    }),

  // Generic PUT method for any endpoint
  put: (endpoint: string, body: unknown) =>
    authenticatedFetch(`/api${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // Generic DELETE method for any endpoint
  delete: (endpoint: string, options: FetchOptions = {}) =>
    authenticatedFetch(`/api${endpoint}`, {
      method: 'DELETE',
      ...options,
    }),
};
