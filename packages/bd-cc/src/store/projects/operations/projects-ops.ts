import type { Project, ProjectSession } from '@/types';

/**
 * 过滤项目列表
 */
export function calcFilterProjects(projects: Project[], query: string): Project[] {
  if (!query) return projects;
  const lower = query.toLowerCase();
  return projects.filter((p) => p.name.toLowerCase().includes(lower));
}

/**
 * 移除项目
 */
export function calcRemoveProject(projects: Project[], projectName: string): Project[] {
  return projects.filter((p) => p.name !== projectName);
}

/**
 * 更新项目
 */
export function calcUpdateProject(
  projects: Project[],
  projectName: string,
  updater: (project: Project) => Project
): Project[] {
  return projects.map((p) => (p.name === projectName ? updater(p) : p));
}

/**
 * 添加或更新项目
 */
export function calcUpsertProject(projects: Project[], project: Project): Project[] {
  const index = projects.findIndex((p) => p.name === project.name);
  if (index >= 0) {
    const updated = [...projects];
    updated[index] = project;
    return updated;
  }
  return [...projects, project];
}

/**
 * 获取项目的所有会话
 */
export function calcGetProjectSessions(project: Project): ProjectSession[] {
  return [
    ...(project.sessions ?? []),
    ...(project.codexSessions ?? []),
    ...(project.cursorSessions ?? []),
    ...(project.geminiSessions ?? []),
  ];
}

/**
 * 移除会话（从所有会话类型中）
 */
export function calcRemoveSessionFromProject(project: Project, sessionId: string): Project {
  const filterSessions = (sessions?: ProjectSession[]) => sessions?.filter((s) => s.id !== sessionId) ?? [];

  return {
    ...project,
    sessions: filterSessions(project.sessions),
    codexSessions: filterSessions(project.codexSessions),
    cursorSessions: filterSessions(project.cursorSessions),
    geminiSessions: filterSessions(project.geminiSessions),
    sessionMeta: {
      ...project.sessionMeta,
      total: Math.max(0, ((project.sessionMeta?.total as number) ?? 0) - 1),
    },
  };
}

/**
 * 更新项目的会话
 */
export function calcUpdateProjectSession(projects: Project[], projectName: string, sessionId: string): Project[] {
  return projects.map((p) => {
    if (p.name !== projectName) return p;
    return calcRemoveSessionFromProject(p, sessionId);
  });
}

/**
 * 检查项目是否有变化
 */
export function calcProjectsHaveChanges(
  prevProjects: Project[],
  nextProjects: Project[],
  includeExternalSessions: boolean
): boolean {
  if (prevProjects.length !== nextProjects.length) {
    return true;
  }

  const serialize = (value: unknown) => JSON.stringify(value ?? null);

  return nextProjects.some((nextProject, index) => {
    const prevProject = prevProjects[index];
    if (!prevProject) {
      return true;
    }

    const baseChanged =
      nextProject.name !== prevProject.name ||
      nextProject.displayName !== prevProject.displayName ||
      nextProject.fullPath !== prevProject.fullPath ||
      serialize(nextProject.sessionMeta) !== serialize(prevProject.sessionMeta) ||
      serialize(nextProject.sessions) !== serialize(prevProject.sessions) ||
      serialize(nextProject.taskmaster) !== serialize(prevProject.taskmaster);

    if (baseChanged) {
      return true;
    }

    if (!includeExternalSessions) {
      return false;
    }

    return (
      serialize(nextProject.cursorSessions) !== serialize(prevProject.cursorSessions) ||
      serialize(nextProject.codexSessions) !== serialize(prevProject.codexSessions) ||
      serialize(nextProject.geminiSessions) !== serialize(prevProject.geminiSessions)
    );
  });
}
