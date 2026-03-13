import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import type { AppSocketMessage, LoadingProgress, Project, ProjectSession, AppTab } from '@/types';
import { projectsAtom, selectedProjectAtom, selectedSessionAtom, activeTabAtom } from '../primitives/projects-atom';
import { projectNamesAtom, currentProjectSessionsAtom, hasActiveSessionAtom } from '../domain/project-derived';
import { calcRemoveProject, calcUpdateProjectSession, calcProjectsHaveChanges } from '../operations/projects-ops';

/**
 * 项目和会话管理 Hook
 */
export function useProjects() {
  const navigate = useNavigate();

  // ========== 持久化状态 (使用 Jotai) ==========
  const [projects] = useAtom(projectsAtom);
  const [selectedProject] = useAtom(selectedProjectAtom);
  const [selectedSession] = useAtom(selectedSessionAtom);
  const [activeTab] = useAtom(activeTabAtom);
  const [projectNames] = useAtom(projectNamesAtom);
  const [sessions] = useAtom(currentProjectSessionsAtom);
  const [hasActiveSession] = useAtom(hasActiveSessionAtom);

  // Setters
  const setProjects = useSetAtom(projectsAtom);
  const setSelectedProject = useSetAtom(selectedProjectAtom);
  const setSelectedSession = useSetAtom(selectedSessionAtom);
  const setActiveTab = useSetAtom(activeTabAtom);

  // ========== UI 状态 (使用 useState，本地状态) ==========
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('agents');
  const [externalMessageUpdate, setExternalMessageUpdate] = useState(0);

  // Refs
  const loadingProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ========== 加载项目列表 ==========
  const fetchProjects = useCallback(
    async ({ showLoadingState = true }: { showLoadingState?: boolean } = {}) => {
      try {
        if (showLoadingState) {
          setIsLoadingProjects(true);
        }
        const response = await api.projects();
        const projectData = (await response.json()) as Project[];

        setProjects((prevProjects) => {
          if (prevProjects.length === 0) {
            return projectData;
          }
          return calcProjectsHaveChanges(prevProjects, projectData, true) ? projectData : prevProjects;
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        if (showLoadingState) {
          setIsLoadingProjects(false);
        }
      }
    },
    [setProjects]
  );

  // 静默刷新
  const refreshProjectsSilently = useCallback(async () => {
    await fetchProjects({ showLoadingState: false });
  }, [fetchProjects]);

  // 初始加载
  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  // 自动选择单个项目
  useEffect(() => {
    if (!isLoadingProjects && projects.length === 1 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [isLoadingProjects, projects, selectedProject, setSelectedProject]);

  // 打开设置面板
  const openSettings = useCallback((tab = 'tools') => {
    setSettingsInitialTab(tab);
    setShowSettings(true);
  }, []);

  // 选择项目
  const selectProject = useCallback(
    (project: Project, isMobile = false) => {
      setSelectedProject(project);
      setSelectedSession(null);
      navigate('/');

      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [navigate, setSelectedProject, setSelectedSession]
  );

  // 选择会话
  const selectSession = useCallback(
    (session: ProjectSession, isMobile = false) => {
      setSelectedSession(session);

      if (activeTab === 'tasks' || activeTab === 'preview') {
        setActiveTab('chat');
      }

      const provider = localStorage.getItem('selected-provider') || 'claude';
      if (provider === 'cursor') {
        sessionStorage.setItem('cursorSessionId', session.id);
      }

      if (isMobile && session.__projectName !== selectedProject?.name) {
        setSidebarOpen(false);
      }

      navigate(`/session/${session.id}`);
    },
    [activeTab, navigate, selectedProject, setActiveTab, setSelectedSession]
  );

  // 创建新会话
  const createNewSession = useCallback(
    (project: Project, isMobile = false) => {
      setSelectedProject(project);
      setSelectedSession(null);
      setActiveTab('chat');
      navigate('/');

      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [navigate, setSelectedProject, setSelectedSession, setActiveTab]
  );

  // 删除会话
  const deleteSession = useCallback(
    (sessionId: string) => {
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        navigate('/');
      }

      if (selectedProject) {
        setProjects((prev) => calcUpdateProjectSession(prev, selectedProject.name, sessionId));
      }
    },
    [navigate, selectedProject, selectedSession, setProjects, setSelectedSession]
  );

  // 删除项目
  const deleteProject = useCallback(
    (projectName: string) => {
      if (selectedProject?.name === projectName) {
        setSelectedProject(null);
        setSelectedSession(null);
        navigate('/');
      }

      setProjects((prev) => calcRemoveProject(prev, projectName));
    },
    [navigate, selectedProject, setProjects, setSelectedProject, setSelectedSession]
  );

  // 刷新侧边栏
  const refreshSidebar = useCallback(async () => {
    try {
      const response = await api.projects();
      const freshProjects = (await response.json()) as Project[];

      setProjects((prevProjects) =>
        calcProjectsHaveChanges(prevProjects, freshProjects, true) ? freshProjects : prevProjects
      );
    } catch (error) {
      console.error('Error refreshing sidebar:', error);
    }
  }, [setProjects]);

  // 清理超时
  useEffect(() => {
    return () => {
      if (loadingProgressTimeoutRef.current) {
        clearTimeout(loadingProgressTimeoutRef.current);
        loadingProgressTimeoutRef.current = null;
      }
    };
  }, []);

  // 设置 Tab
  const handleSetActiveTab = useCallback(
    (tab: typeof activeTab) => {
      setActiveTab(tab);
      try {
        localStorage.setItem('activeTab', tab);
      } catch {
        // Silently ignore storage errors
      }
    },
    [setActiveTab]
  );

  // 关闭设置面板
  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, [setShowSettings]);

  // 兼容旧接口的 setActiveTab
  const setActiveTabDispatch: Dispatch<SetStateAction<AppTab>> = useCallback(
    (action: SetStateAction<AppTab>) => {
      const newTab = typeof action === 'function' ? action(activeTab) : action;
      setActiveTab(newTab);
      try {
        localStorage.setItem('activeTab', newTab);
      } catch {
        // Silently ignore storage errors
      }
    },
    [activeTab, setActiveTab]
  );

  return {
    // ========== 持久化状态 ==========
    projects,
    selectedProject,
    selectedSession,
    activeTab,
    projectNames,
    sessions,
    hasActiveSession,
    // ========== UI 状态 ==========
    sidebarOpen,
    isLoadingProjects,
    loadingProgress,
    isInputFocused,
    showSettings,
    settingsInitialTab,
    externalMessageUpdate,
    // ========== Setters ==========
    setSidebarOpen,
    setIsInputFocused,
    setShowSettings,
    setSettingsInitialTab,
    // ========== 操作 (兼容旧接口) ==========
    setActiveTab: setActiveTabDispatch,
    openSettings,
    closeSettings,
    onCloseSettings: closeSettings,
    fetchProjects,
    refreshProjectsSilently,
    // 兼容旧接口别名
    selectProject,
    onProjectSelect: selectProject,
    selectSession,
    onSessionSelect: selectSession,
    createNewSession,
    onNewSession: createNewSession,
    deleteSession,
    onSessionDelete: deleteSession,
    deleteProject,
    onProjectDelete: deleteProject,
    refreshSidebar,
    onRefresh: refreshSidebar,
  };
}
