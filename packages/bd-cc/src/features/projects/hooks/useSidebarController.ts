import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import type { Session } from '@shared/api/sessions';
import { SessionsListResponseSchema } from '@shared/api/sessions';
import { validateResponse } from '@shared/api/validation';
import type {
  AdditionalSessionsByProject,
  DeleteProjectConfirmation,
  LoadingSessionsByProject,
  ProjectSortOrder,
  SessionDeleteConfirmation,
  SessionWithProvider,
} from '../types';
import {
  filterProjects,
  getAllSessions,
  loadStarredProjects,
  persistStarredProjects,
  readProjectSortOrder,
  sortProjects,
} from '../biz/sidebar-utils';
import type { Project, ProjectSession, SessionProvider } from '@/types';
import { api } from '@/utils/api';

type SnippetHighlight = {
  start: number;
  end: number;
};

type ConversationMatch = {
  role: string;
  snippet: string;
  highlights: SnippetHighlight[];
  timestamp: string | null;
  provider?: string;
  messageUuid?: string | null;
};

type ConversationSession = {
  sessionId: string;
  sessionSummary: string;
  provider?: string;
  matches: ConversationMatch[];
};

type ConversationProjectResult = {
  projectName: string;
  projectDisplayName: string;
  sessions: ConversationSession[];
};

export type ConversationSearchResults = {
  results: ConversationProjectResult[];
  totalMatches: number;
  query: string;
};

export type SearchProgress = {
  scannedProjects: number;
  totalProjects: number;
};

type UseSidebarControllerArgs = {
  projects: Project[];
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  isLoading: boolean;
  isMobile: boolean;
  t: TFunction;
  onRefresh: () => Promise<void> | void;
  onProjectSelect: (project: Project) => void;
  onSessionSelect: (session: ProjectSession) => void;
  onSessionDelete?: (sessionId: string) => void;
  onProjectDelete?: (projectName: string) => void;
  setCurrentProject: (project: Project) => void;
  setSidebarVisible: (visible: boolean) => void;
  sidebarVisible: boolean;
};

export function useSidebarController({
  projects,
  selectedProject,
  selectedSession: _selectedSession,
  isLoading,
  isMobile,
  t,
  onRefresh,
  onProjectSelect,
  onSessionSelect,
  onSessionDelete,
  onProjectDelete,
  setCurrentProject,
  setSidebarVisible,
  sidebarVisible,
}: UseSidebarControllerArgs) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [loadingSessions, setLoadingSessions] = useState<LoadingSessionsByProject>({});
  const [additionalSessions, setAdditionalSessions] = useState<AdditionalSessionsByProject>({});
  const [initialSessionsLoaded, setInitialSessionsLoaded] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [projectSortOrder, setProjectSortOrder] = useState<ProjectSortOrder>('name');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [projectHasMoreOverrides, setProjectHasMoreOverrides] = useState<Record<string, boolean>>({});
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteProjectConfirmation | null>(null);
  const [sessionDeleteConfirmation, setSessionDeleteConfirmation] = useState<SessionDeleteConfirmation | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [starredProjects, setStarredProjects] = useState<Set<string>>(() => loadStarredProjects());
  const [searchMode, setSearchMode] = useState<'projects' | 'conversations'>('projects');
  const [conversationResults, setConversationResults] = useState<ConversationSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeqRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const isSidebarCollapsed = !isMobile && !sidebarVisible;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 持久化展开状态到 sessionStorage
  const [persistedExpandedProjects, setPersistedExpandedProjects] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('sidebar-expanded-projects');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    // 保存展开状态
    try {
      sessionStorage.setItem('sidebar-expanded-projects', JSON.stringify([...expandedProjects]));
    } catch {
      // ignore
    }
  }, [expandedProjects]);

  useEffect(() => {
    // 当项目列表加载完成且有之前展开的项目时，自动加载这些项目的会话
    if (projects.length > 0 && !isLoading && persistedExpandedProjects.size > 0) {
      const projectsToLoad = projects.filter(
        (p) => persistedExpandedProjects.has(p.name) && !initialSessionsLoaded.has(p.name)
      );

      projectsToLoad.forEach((project) => {
        const loadInitialSessions = async () => {
          try {
            const response = await api.sessions(project.name, 5, 0);
            if (response.ok) {
              const json = await response.json();
              const result = validateResponse(SessionsListResponseSchema, json, {
                endpoint: `/api/projects/${project.name}/sessions`,
                status: response.status,
                fallbackValue: { items: [] },
              });
              const sessions: Session[] = result?.items || [];
              if (sessions.length > 0) {
                const mappedSessions = sessions.map((session) => ({
                  id: session.id,
                  name: session.customName || session.id,
                  summary: session.customName,
                  createdAt: session.createdAt,
                  lastActivity: session.updatedAt,
                  messageCount: session.messageCount,
                  updated_at: session.updatedAt,
                }));
                setAdditionalSessions((prev) => ({
                  ...prev,
                  [project.name]: mappedSessions,
                }));
              }
              setInitialSessionsLoaded((prev) => {
                const next = new Set(prev);
                next.add(project.name);
                return next;
              });
              if (sessions.length < 5) {
                setProjectHasMoreOverrides((prev) => ({ ...prev, [project.name]: false }));
              }
            }
          } catch (error) {
            console.error('Error loading initial sessions:', error);
          }
        };
        void loadInitialSessions();
      });
    }
  }, [projects, isLoading, persistedExpandedProjects, initialSessionsLoaded]);

  // 当 selectedProject 变化时，自动展开并加载会话
  useEffect(() => {
    if (selectedProject) {
      // 展开项目
      setExpandedProjects((prev) => {
        if (prev.has(selectedProject.name)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(selectedProject.name);
        return next;
      });

      // 如果会话未加载，自动加载
      if (!initialSessionsLoaded.has(selectedProject.name)) {
        const loadInitialSessions = async () => {
          try {
            const response = await api.sessions(selectedProject.name, 5, 0);
            if (response.ok) {
              const json = await response.json();
              const result = validateResponse(SessionsListResponseSchema, json, {
                endpoint: `/api/projects/${selectedProject.name}/sessions`,
                status: response.status,
                fallbackValue: { items: [] },
              });
              const sessions: Session[] = result?.items || [];
              if (sessions.length > 0) {
                const mappedSessions = sessions.map((session) => ({
                  id: session.id,
                  name: session.customName || session.id,
                  summary: session.customName,
                  createdAt: session.createdAt,
                  lastActivity: session.updatedAt,
                  messageCount: session.messageCount,
                  updated_at: session.updatedAt,
                }));
                setAdditionalSessions((prev) => ({
                  ...prev,
                  [selectedProject.name]: mappedSessions,
                }));
              }
              setInitialSessionsLoaded((prev) => {
                const next = new Set(prev);
                next.add(selectedProject.name);
                return next;
              });
              if (sessions.length < 5) {
                setProjectHasMoreOverrides((prev) => ({ ...prev, [selectedProject.name]: false }));
              }
            }
          } catch (error) {
            console.error('Error loading initial sessions:', error);
          }
        };
        void loadInitialSessions();
      }
    }
  }, [selectedProject, initialSessionsLoaded]);

  useEffect(() => {
    // 当项目列表加载完成且之前没有加载过任何会话时，自动为所有项目加载会话
    if (projects.length > 0 && !isLoading && initialSessionsLoaded.size === 0) {
      projects.forEach((project) => {
        if (!initialSessionsLoaded.has(project.name)) {
          const loadInitialSessions = async () => {
            try {
              const response = await api.sessions(project.name, 5, 0);
              if (response.ok) {
                const json = await response.json();
                const result = validateResponse(SessionsListResponseSchema, json, {
                  endpoint: `/api/projects/${project.name}/sessions`,
                  status: response.status,
                  fallbackValue: { items: [] },
                });
                const sessions: Session[] = result?.items || [];
                if (sessions.length > 0) {
                  const mappedSessions = sessions.map((session) => ({
                    id: session.id,
                    name: session.customName || session.id,
                    summary: session.customName,
                    createdAt: session.createdAt,
                    lastActivity: session.updatedAt,
                    messageCount: session.messageCount,
                    updated_at: session.updatedAt,
                  }));
                  setAdditionalSessions((prev) => ({
                    ...prev,
                    [project.name]: mappedSessions,
                  }));
                }
                setInitialSessionsLoaded((prev) => {
                  const next = new Set(prev);
                  next.add(project.name);
                  return next;
                });
                if (sessions.length < 5) {
                  setProjectHasMoreOverrides((prev) => ({ ...prev, [project.name]: false }));
                }
              }
            } catch (error) {
              console.error('Error loading initial sessions:', error);
            }
          };
          void loadInitialSessions();
        }
      });
    }
  }, [projects, isLoading, initialSessionsLoaded]);

  useEffect(() => {
    const loadSortOrder = () => {
      setProjectSortOrder(readProjectSortOrder());
    };

    loadSortOrder();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'claude-settings') {
        loadSortOrder();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Debounced conversation search with SSE streaming
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const query = searchFilter.trim();
    if (searchMode !== 'conversations' || query.length < 2) {
      searchSeqRef.current += 1;
      setConversationResults(null);
      setSearchProgress(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const seq = ++searchSeqRef.current;

    searchTimeoutRef.current = setTimeout(() => {
      if (seq !== searchSeqRef.current) return;

      const url = api.searchConversationsUrl(query);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      const accumulated: ConversationProjectResult[] = [];
      let totalMatches = 0;

      es.addEventListener('result', (evt) => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        try {
          const data = JSON.parse(evt.data) as {
            projectResult: ConversationProjectResult;
            totalMatches: number;
            scannedProjects: number;
            totalProjects: number;
          };
          accumulated.push(data.projectResult);
          totalMatches = data.totalMatches;
          setConversationResults({ results: [...accumulated], totalMatches, query });
          setSearchProgress({ scannedProjects: data.scannedProjects, totalProjects: data.totalProjects });
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('progress', (evt) => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        try {
          const data = JSON.parse(evt.data) as { totalMatches: number; scannedProjects: number; totalProjects: number };
          totalMatches = data.totalMatches;
          setSearchProgress({ scannedProjects: data.scannedProjects, totalProjects: data.totalProjects });
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('done', () => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        es.close();
        eventSourceRef.current = null;
        setIsSearching(false);
        setSearchProgress(null);
        if (accumulated.length === 0) {
          setConversationResults({ results: [], totalMatches: 0, query });
        }
      });

      es.addEventListener('error', () => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        es.close();
        eventSourceRef.current = null;
        setIsSearching(false);
        setSearchProgress(null);
        if (accumulated.length === 0) {
          setConversationResults({ results: [], totalMatches: 0, query });
        }
      });
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [searchFilter, searchMode]);

  const toggleProject = useCallback(
    (projectName: string) => {
      const project = projects.find((p) => p.name === projectName);
      const isExpanding = project && !expandedProjects.has(projectName);

      setExpandedProjects((prev) => {
        const next = new Set<string>();
        if (!prev.has(projectName)) {
          next.add(projectName);
        }
        return next;
      });

      // Load sessions when expanding a project (if not already loaded)
      if (isExpanding && project && !initialSessionsLoaded.has(projectName)) {
        const loadInitialSessions = async () => {
          try {
            const response = await api.sessions(projectName, 5, 0);
            if (response.ok) {
              const json = await response.json();
              const result = validateResponse(SessionsListResponseSchema, json, {
                endpoint: `/api/projects/${projectName}/sessions`,
                status: response.status,
                fallbackValue: { items: [] },
              });
              const sessions: Session[] = result?.items || [];
              if (sessions.length > 0) {
                const mappedSessions = sessions.map((session) => ({
                  id: session.id,
                  name: session.customName || session.id,
                  summary: session.customName,
                  createdAt: session.createdAt,
                  lastActivity: session.updatedAt,
                  messageCount: session.messageCount,
                  updated_at: session.updatedAt,
                }));
                setAdditionalSessions((prev) => ({
                  ...prev,
                  [projectName]: mappedSessions,
                }));
              }
              setInitialSessionsLoaded((prev) => {
                const next = new Set(prev);
                next.add(projectName);
                return next;
              });
              if (sessions.length < 5) {
                setProjectHasMoreOverrides((prev) => ({ ...prev, [projectName]: false }));
              }
            }
          } catch (error) {
            console.error('Error loading initial sessions:', error);
          }
        };
        void loadInitialSessions();
      }
    },
    [projects, expandedProjects, initialSessionsLoaded]
  );

  const handleSessionClick = useCallback(
    (session: SessionWithProvider, projectName: string) => {
      onSessionSelect({ ...session, __projectName: projectName });
    },
    [onSessionSelect]
  );

  const toggleStarProject = useCallback((projectName: string) => {
    setStarredProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }

      persistStarredProjects(next);
      return next;
    });
  }, []);

  const isProjectStarred = useCallback((projectName: string) => starredProjects.has(projectName), [starredProjects]);

  const getProjectSessions = useCallback(
    (project: Project) => getAllSessions(project, additionalSessions),
    [additionalSessions]
  );

  const projectsWithSessionMeta = useMemo(
    () =>
      projects.map((project) => {
        const hasMoreOverride = projectHasMoreOverrides[project.name];
        if (hasMoreOverride === undefined) {
          return project;
        }

        return {
          ...project,
          sessionMeta: { ...project.sessionMeta, hasMore: hasMoreOverride },
        };
      }),
    [projectHasMoreOverrides, projects]
  );

  const sortedProjects = useMemo(
    () => sortProjects(projectsWithSessionMeta, projectSortOrder, starredProjects, additionalSessions),
    [additionalSessions, projectSortOrder, projectsWithSessionMeta, starredProjects]
  );

  const filteredProjects = useMemo(() => filterProjects(sortedProjects, searchFilter), [searchFilter, sortedProjects]);

  const startEditing = useCallback((project: Project) => {
    setEditingProject(project.name);
    setEditingName(project.displayName);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingProject(null);
    setEditingName('');
  }, []);

  const saveProjectName = useCallback(
    async (projectName: string) => {
      try {
        const response = await api.renameProject(projectName, editingName);
        if (response.ok) {
          if (window.refreshProjects) {
            await window.refreshProjects();
          } else {
            window.location.reload();
          }
        } else {
          console.error('Failed to rename project');
        }
      } catch (error) {
        console.error('Error renaming project:', error);
      } finally {
        setEditingProject(null);
        setEditingName('');
      }
    },
    [editingName]
  );

  const showDeleteSessionConfirmation = useCallback(
    (
      projectName: string,
      sessionId: string,
      sessionTitle: string,
      provider: SessionDeleteConfirmation['provider'] = 'claude'
    ) => {
      setSessionDeleteConfirmation({ projectName, sessionId, sessionTitle, provider });
    },
    []
  );

  const confirmDeleteSession = useCallback(async () => {
    if (!sessionDeleteConfirmation) {
      return;
    }

    const { projectName, sessionId, provider } = sessionDeleteConfirmation;
    setSessionDeleteConfirmation(null);

    try {
      let response;
      if (provider === 'codex') {
        response = await api.deleteCodexSession(sessionId);
      } else if (provider === 'gemini') {
        response = await api.deleteGeminiSession(sessionId);
      } else {
        response = await api.deleteSession(projectName, sessionId);
      }

      if (response.ok) {
        onSessionDelete?.(sessionId);
      } else {
        const errorText = await response.text();
        console.error('[Sidebar] Failed to delete session:', {
          status: response.status,
          error: errorText,
        });
        alert(t('messages.deleteSessionFailed'));
      }
    } catch (error) {
      console.error('[Sidebar] Error deleting session:', error);
      alert(t('messages.deleteSessionError'));
    }
  }, [onSessionDelete, sessionDeleteConfirmation, t]);

  const requestProjectDelete = useCallback(
    (project: Project) => {
      setDeleteConfirmation({
        project,
        sessionCount: getProjectSessions(project).length,
      });
    },
    [getProjectSessions]
  );

  const confirmDeleteProject = useCallback(async () => {
    if (!deleteConfirmation) {
      return;
    }

    const { project, sessionCount } = deleteConfirmation;
    const isEmpty = sessionCount === 0;

    setDeleteConfirmation(null);
    setDeletingProjects((prev) => new Set([...prev, project.name]));

    try {
      const response = await api.deleteProject(project.name, !isEmpty);

      if (response.ok) {
        onProjectDelete?.(project.name);
      } else {
        const error = (await response.json()) as { error?: string };
        alert(error.error || t('messages.deleteProjectFailed'));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(t('messages.deleteProjectError'));
    } finally {
      setDeletingProjects((prev) => {
        const next = new Set(prev);
        next.delete(project.name);
        return next;
      });
    }
  }, [deleteConfirmation, onProjectDelete, t]);

  const loadMoreSessions = useCallback(
    async (project: Project) => {
      const hasMoreOverride = projectHasMoreOverrides[project.name];
      const canLoadMore = hasMoreOverride !== undefined ? hasMoreOverride : project.sessionMeta?.hasMore === true;
      if (!canLoadMore || loadingSessions[project.name]) {
        return;
      }

      setLoadingSessions((prev) => ({ ...prev, [project.name]: true }));

      try {
        const currentSessionCount = (project.sessions?.length || 0) + (additionalSessions[project.name]?.length || 0);
        const response = await api.sessions(project.name, 5, currentSessionCount);

        if (!response.ok) {
          return;
        }

        const json = await response.json();
        const result = validateResponse(SessionsListResponseSchema, json, {
          endpoint: `/api/projects/${project.name}/sessions`,
          status: response.status,
          fallbackValue: { items: [] },
        });
        const sessions: Session[] = result?.items || [];
        const mappedSessions = sessions.map((session) => ({
          id: session.id,
          name: session.customName || session.id,
          summary: session.customName,
          createdAt: session.createdAt,
          lastActivity: session.updatedAt,
          messageCount: session.messageCount,
          updated_at: session.updatedAt,
        }));

        setAdditionalSessions((prev) => ({
          ...prev,
          [project.name]: [...(prev[project.name] || []), ...mappedSessions],
        }));

        if (sessions.length < 5) {
          // Keep hasMore state in local hook state instead of mutating the project prop object.
          setProjectHasMoreOverrides((prev) => ({ ...prev, [project.name]: false }));
        }
      } catch (error) {
        console.error('Error loading more sessions:', error);
      } finally {
        setLoadingSessions((prev) => ({ ...prev, [project.name]: false }));
      }
    },
    [additionalSessions, loadingSessions, projectHasMoreOverrides]
  );

  const handleProjectSelect = useCallback(
    (project: Project) => {
      onProjectSelect(project);
      setCurrentProject(project);
    },
    [onProjectSelect, setCurrentProject]
  );

  const refreshProjects = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const updateSessionSummary = useCallback(
    async (_projectName: string, sessionId: string, summary: string, provider: SessionProvider) => {
      const trimmed = summary.trim();
      if (!trimmed) {
        setEditingSession(null);
        setEditingSessionName('');
        return;
      }
      try {
        const response = await api.renameSession(sessionId, trimmed, provider);
        if (response.ok) {
          await onRefresh();
        } else {
          console.error('[Sidebar] Failed to rename session:', response.status);
          alert(t('messages.renameSessionFailed'));
        }
      } catch (error) {
        console.error('[Sidebar] Error renaming session:', error);
        alert(t('messages.renameSessionError'));
      } finally {
        setEditingSession(null);
        setEditingSessionName('');
      }
    },
    [onRefresh, t]
  );

  const collapseSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, [setSidebarVisible]);

  const expandSidebar = useCallback(() => {
    setSidebarVisible(true);
  }, [setSidebarVisible]);

  return {
    isSidebarCollapsed,
    expandedProjects,
    editingProject,
    showNewProject,
    editingName,
    loadingSessions,
    additionalSessions,
    initialSessionsLoaded,
    currentTime,
    projectSortOrder,
    isRefreshing,
    editingSession,
    editingSessionName,
    searchFilter,
    deletingProjects,
    deleteConfirmation,
    sessionDeleteConfirmation,
    showVersionModal,
    starredProjects,
    filteredProjects,
    toggleProject,
    handleSessionClick,
    toggleStarProject,
    isProjectStarred,
    getProjectSessions,
    startEditing,
    cancelEditing,
    saveProjectName,
    showDeleteSessionConfirmation,
    confirmDeleteSession,
    requestProjectDelete,
    confirmDeleteProject,
    loadMoreSessions,
    handleProjectSelect,
    refreshProjects,
    updateSessionSummary,
    collapseSidebar,
    expandSidebar,
    setShowNewProject,
    setEditingName,
    setEditingSession,
    setEditingSessionName,
    searchMode,
    setSearchMode,
    conversationResults,
    isSearching,
    searchProgress,
    clearConversationResults: useCallback(() => {
      searchSeqRef.current += 1;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsSearching(false);
      setSearchProgress(null);
      setConversationResults(null);
    }, []),
    setSearchFilter,
    setDeleteConfirmation,
    setSessionDeleteConfirmation,
    setShowVersionModal,
  };
}
