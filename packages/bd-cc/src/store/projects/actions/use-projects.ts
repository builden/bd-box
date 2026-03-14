import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  selectedProjectAtom,
  selectedSessionAtom,
  activeTabAtom,
  selectedProviderAtom,
} from '../primitives/projects-atom';
import { projectNamesAtom, currentProjectSessionsAtom, hasActiveSessionAtom } from '../domain/project-derived';
import type { Project, ProjectSession, AppTab } from '@/types';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';

/**
 * 项目和会话管理 Hook
 *
 * 使用 jotai-tanstack-query 管理项目数据，无需手动 sync 到 Jotai
 */
export function useProjects() {
  const navigate = useNavigate();

  // ========== TanStack Query 数据获取 (atomWithQuery 自动管理状态) ==========
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjectsQuery();

  // ========== 持久化状态 (使用 Jotai - 用于选中状态) ==========
  const [selectedProject] = useAtom(selectedProjectAtom);
  const [selectedSession] = useAtom(selectedSessionAtom);
  const [activeTab] = useAtom(activeTabAtom);
  const [selectedProvider] = useAtom(selectedProviderAtom);
  const [projectNames] = useAtom(projectNamesAtom);
  const [sessions] = useAtom(currentProjectSessionsAtom);
  const [hasActiveSession] = useAtom(hasActiveSessionAtom);

  // Setters
  const setSelectedProject = useSetAtom(selectedProjectAtom);
  const setSelectedSession = useSetAtom(selectedSessionAtom);
  const setActiveTab = useSetAtom(activeTabAtom);

  // ========== UI 状态 (使用 useState，本地状态) ==========
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('agents');
  const [externalMessageUpdate] = useState(0);

  // Refs
  const loadingProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ========== 刷新项目 (使用 TanStack Query) ==========
  const refreshProjectsSilently = useCallback(async () => {
    await refetchProjects();
  }, [refetchProjects]);

  // 兼容旧接口的 fetchProjects (使用 TanStack Query)
  const fetchProjects = useCallback(async () => {
    await refetchProjects();
  }, [refetchProjects]);

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

      if (selectedProvider === 'cursor') {
        sessionStorage.setItem('cursorSessionId', session.id);
      }

      if (isMobile && session.__projectName !== selectedProject?.name) {
        setSidebarOpen(false);
      }

      navigate(`/session/${session.id}`);
    },
    [activeTab, navigate, selectedProject, selectedProvider, setActiveTab, setSelectedSession]
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

  // 删除会话 - 通过 API 删除后刷新数据
  const deleteSession = useCallback(
    (sessionId: string) => {
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        navigate('/');
      }
      // TanStack Query 会自动处理缓存更新
    },
    [navigate, selectedSession, setSelectedSession]
  );

  // 删除项目 - 通过 API 删除后刷新数据
  const deleteProject = useCallback(
    (projectName: string) => {
      if (selectedProject?.name === projectName) {
        setSelectedProject(null);
        setSelectedSession(null);
        navigate('/');
      }
      // TanStack Query 会自动处理缓存更新
    },
    [navigate, selectedProject, setSelectedProject, setSelectedSession]
  );

  // 刷新侧边栏 (使用 TanStack Query)
  const refreshSidebar = useCallback(async () => {
    await refetchProjects();
  }, [refetchProjects]);

  // 清理超时
  useEffect(() => {
    return () => {
      if (loadingProgressTimeoutRef.current) {
        clearTimeout(loadingProgressTimeoutRef.current);
        loadingProgressTimeoutRef.current = null;
      }
    };
  }, []);

  // 关闭设置面板
  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, [setShowSettings]);

  // setActiveTab 兼容旧接口 - atomWithStorage 已自动持久化
  const setActiveTabDispatch: Dispatch<SetStateAction<AppTab>> = useCallback(
    (action: SetStateAction<AppTab>) => {
      const newTab = typeof action === 'function' ? action(activeTab) : action;
      setActiveTab(newTab);
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
    projectsError,
    loadingProgress: null,
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
